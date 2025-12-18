from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
import time
import asyncio
import numpy as np
from typing import List

from backend.api.models import (
    ExpressionRequest, ParseRequest, BatchExpressionRequest, ParameterUpdateRequest,
    ParametricRequest, ParseResponse, EvaluationResponse, BatchEvaluationResponse, ErrorResponse,
    GraphDataResponse, Surface3DRequest, Parametric3DRequest, Evaluation3DResponse,
    GraphData3DResponse, CoordinatePoint3D
)
from backend.core.math_engine import evaluator
from backend.core.cache import get_cache, generate_cache_key
from backend.core.config import settings

router = APIRouter()

@router.post("/parse", response_model=ParseResponse)
async def parse_expression(request: ParseRequest):
    """
    Parse a mathematical expression and extract variables with advanced classification.
    """
    try:
        # Parse and classify expression
        classification = evaluator.parse_and_classify_expression(request.expression)
        
        return ParseResponse(
            is_valid=classification['is_valid'],
            variables=classification['variables'],
            error=classification.get('error'),
            expression_type=classification['type'],
            processed_expression=classification.get('processed_expression'),
            parameters=classification.get('parameters', []),
            primary_variable=classification.get('primary_variable'),
            classification=classification
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_expression(request: ExpressionRequest):
    """
    Evaluate a mathematical expression (explicit, implicit, or parametric) and generate graph data.
    """
    start_time = time.time()
    
    try:
        # Parse and classify expression
        classification = evaluator.parse_and_classify_expression(request.expression)
        
        if not classification['is_valid']:
            raise HTTPException(status_code=400, detail=classification.get('error', 'Invalid expression'))
        
        coordinates = []
        valid_count = 0
        x_range = request.x_range
        y_range = (0.0, 1.0)
        
        if classification['type'] == 'implicit':
            # Handle implicit equations (f(x, y) = 0)
            x_coords, y_coords = evaluator.solve_implicit_equation(
                request.expression,
                x_range,
                request.num_points,
                request.variables
            )
            
# Create coordinate points for implicit equation
            for x, y in zip(x_coords, y_coords):
                if not np.isnan(y) and not np.isinf(y):
                    coordinates.append({"x": float(x), "y": float(y)})
                    valid_count += 1
                     
        elif classification['type'] == 'parametric':
            # Handle parametric equations as explicit for now
            x_values = np.linspace(x_range[0], x_range[1], request.num_points)
            y_values = evaluator.evaluate_expression(
                classification.get('processed_expression', request.expression), 
                x_values, 
                request.variables
            )
            
            # Create coordinate points
            for x, y in zip(x_values, y_values):
                if not np.isnan(y) and not np.isinf(y):
                    coordinates.append({"x": float(x), "y": float(y)})
                    valid_count += 1
                    
        else:  # explicit function
            # Handle explicit functions y = f(x)
            x_values = np.linspace(x_range[0], x_range[1], request.num_points)
            y_values = evaluator.evaluate_expression(
                classification.get('processed_expression', request.expression), 
                x_values, 
                request.variables
            )
            
            # Create coordinate points
            for x, y in zip(x_values, y_values):
                if not np.isnan(y) and not np.isinf(y):
                    coordinates.append({"x": float(x), "y": float(y)})
                    valid_count += 1
        
        # Calculate y range
        if coordinates:
            y_coords = [point["y"] for point in coordinates]
            y_range = (min(y_coords), max(y_coords)) if y_coords else (0.0, 1.0)
        
        # Create response
        end_time = time.time()
        
        return EvaluationResponse(
            expression=request.expression,
            graph_data=GraphDataResponse(
                coordinates=coordinates,
                total_points=request.num_points,
                valid_points=valid_count,
                x_range=x_range,
                y_range=y_range
            ),
            evaluation_time_ms=(end_time - start_time) * 1000
        )
        
    except HTTPException:
        raise
    except Exception as e:
        end_time = time.time()
        raise HTTPException(
            status_code=400, 
            detail=str(e),
            headers={"X-Evaluation-Time-ms": str((end_time - start_time) * 1000)}
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Expression evaluation failed: {str(e)}")

@router.post("/batch-evaluate", response_model=BatchEvaluationResponse)
async def batch_evaluate_expressions(request: BatchExpressionRequest):
    """
    Evaluate multiple expressions in parallel.
    """
    if len(request.expressions) > settings.MAX_BATCH_SIZE:
        raise HTTPException(
            status_code=400, 
            detail=f"Batch size exceeds maximum of {settings.MAX_BATCH_SIZE} expressions"
        )
    
    start_time = time.time()
    
    try:
        # Create tasks for parallel evaluation
        tasks = []
        for expression in request.expressions:
            # Create individual expression request
            expr_request = ExpressionRequest(
                expression=expression,
                variables=request.variables,
                x_range=request.x_range,
                num_points=request.num_points
            )
            
            # Create async task
            task = evaluate_single_expression_async(expr_request)
            tasks.append(task)
        
        # Execute all tasks in parallel
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results and handle exceptions
        evaluation_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                # Create error response for failed expression
                error_response = EvaluationResponse(
                    expression=request.expressions[i],
                    graph_data=None,
                    evaluation_time_ms=0
                )
                evaluation_results.append(error_response)
            else:
                evaluation_results.append(result)
        
        total_time_ms = (time.time() - start_time) * 1000
        
        return BatchEvaluationResponse(
            results=evaluation_results,
            total_expressions=len(request.expressions),
            total_evaluation_time_ms=total_time_ms
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Batch evaluation failed: {str(e)}")

async def evaluate_single_expression_async(request: ExpressionRequest) -> EvaluationResponse:
    """
    Helper function to evaluate a single expression asynchronously.
    """
    try:
        # Check cache first
        cache_key = generate_cache_key(request.expression, request.variables, request.x_range)
        cache = get_cache()
        cached_result = await cache.get(cache_key) if cache else None
        
        if cached_result:
            return cached_result
        
        start_time = time.time()
        
        # Generate graph data
        graph_data = evaluator.generate_graph_data(
            expression=request.expression,
            x_range=request.x_range,
            num_points=request.num_points,
            params=request.variables
        )
        
        evaluation_time_ms = (time.time() - start_time) * 1000
        
        # Create response
        response = EvaluationResponse(
            expression=request.expression,
            graph_data=graph_data,
            evaluation_time_ms=evaluation_time_ms
        )
        
        # Cache the result
        if cache:
            await cache.set(cache_key, response, settings.CACHE_TTL)
        
        return response
        
    except Exception as e:
        # Return a response with error information
        return EvaluationResponse(
            expression=request.expression,
            graph_data=None,
            evaluation_time_ms=0
        )

@router.post("/update-params", response_model=EvaluationResponse)
async def update_parameters(request: ParameterUpdateRequest):
    """
    Update parameters for an existing expression and get new graph data.
    """
    start_time = time.time()
    
    try:
        # Validate expression first
        is_valid, error_msg = evaluator.parser.validate_expression(request.expression)
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"Invalid expression: {error_msg}")
        
        # Check cache first
        cache_key = generate_cache_key(request.expression, request.variables, request.x_range)
        cache = get_cache()
        cached_result = await cache.get(cache_key) if cache else None
        
        if cached_result:
            return cached_result
        
        # Generate graph data with new parameters
        graph_data = evaluator.generate_graph_data(
            expression=request.expression,
            x_range=request.x_range,
            num_points=1000,  # Default for parameter updates
            params=request.variables
        )
        
        evaluation_time_ms = (time.time() - start_time) * 1000
        
        # Create response
        response = EvaluationResponse(
            expression=request.expression,
            graph_data=graph_data,
            evaluation_time_ms=evaluation_time_ms
        )
        
        # Cache the result (shorter TTL for parameter updates)
        if cache:
            await cache.set(cache_key, response, 300)  # 5 minutes
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Parameter update failed: {str(e)}")

@router.post("/parametric", response_model=EvaluationResponse)
async def evaluate_parametric(request: ParametricRequest):
    """
    Evaluate parametric equations x(t), y(t) and generate graph data.
    """
    start_time = time.time()
    
    try:
        # Evaluate parametric equations
        x_values, y_values = evaluator.evaluate_parametric(
            request.x_expression,
            request.y_expression,
            request.t_range,
            request.num_points,
            request.variables
        )
        
        # Create coordinate points
        coordinates = []
        valid_count = 0
        for x, y in zip(x_values, y_values):
            if not np.isnan(x) and not np.isnan(y) and not np.isinf(x) and not np.isinf(y):
                coordinates.append({"x": float(x), "y": float(y)})
                valid_count += 1
        
        # Calculate ranges
        x_coords = [point["x"] for point in coordinates]
        y_coords = [point["y"] for point in coordinates]
        x_range = (min(x_coords), max(x_coords)) if x_coords else (0.0, 1.0)
        y_range = (min(y_coords), max(y_coords)) if y_coords else (0.0, 1.0)
        
        # Create response
        end_time = time.time()
        
        return EvaluationResponse(
            expression=f"parametric: x={request.x_expression}, y={request.y_expression}",
            graph_data=GraphDataResponse(
                coordinates=coordinates,
                total_points=request.num_points,
                valid_points=valid_count,
                x_range=x_range,
                y_range=y_range
            ),
            evaluation_time_ms=(end_time - start_time) * 1000
        )
        
    except Exception as e:
        end_time = time.time()
        raise HTTPException(
            status_code=400, 
            detail=str(e),
            headers={"X-Evaluation-Time-ms": str((end_time - start_time) * 1000)}
        )

@router.post("/surface-3d", response_model=Evaluation3DResponse)
async def evaluate_3d_surface(request: Surface3DRequest):
    """
    Evaluate a 3D surface z = f(x, y) and generate graph data.
    """
    start_time = time.time()
    
    try:
        # Generate 3D surface data
        coordinates, z_range = evaluator.evaluate_3d_surface(
            request.expression,
            request.x_range,
            request.y_range,
            request.resolution,
            request.variables
        )
        
        # Create response
        end_time = time.time()
        
        return Evaluation3DResponse(
            expression=request.expression,
            graph_type="surface",
            graph_data=GraphData3DResponse(
                coordinates=[{"x": float(coord[0]), "y": float(coord[1]), "z": float(coord[2])} for coord in coordinates],
                total_points=request.resolution * request.resolution,
                valid_points=len([coord for coord in coordinates if not np.isnan(coord[2])]),
                x_range=request.x_range,
                y_range=request.y_range,
                z_range=z_range
            ),
            evaluation_time_ms=(end_time - start_time) * 1000
        )
        
    except Exception as e:
        end_time = time.time()
        raise HTTPException(
            status_code=400, 
            detail=f"3D surface evaluation failed: {str(e)}",
            headers={"X-Evaluation-Time-ms": str((end_time - start_time) * 1000)}
        )

@router.post("/parametric-3d", response_model=Evaluation3DResponse)
async def evaluate_3d_parametric(request: Parametric3DRequest):
    """
    Evaluate 3D parametric equations x(u, v), y(u, v), z(u, v) and generate graph data.
    """
    start_time = time.time()
    
    try:
        # Generate 3D parametric surface data
        coordinates, z_range = evaluator.evaluate_3d_parametric(
            request.x_expression,
            request.y_expression,
            request.z_expression,
            request.u_range,
            request.v_range,
            request.resolution,
            request.variables
        )
        
        # Create response
        end_time = time.time()
        
        return Evaluation3DResponse(
            expression=f"parametric: x={request.x_expression}, y={request.y_expression}, z={request.z_expression}",
            graph_type="parametric",
            graph_data=GraphData3DResponse(
                coordinates=[{"x": float(coord[0]), "y": float(coord[1]), "z": float(coord[2])} for coord in coordinates],
                total_points=request.resolution * request.resolution,
                valid_points=len([coord for coord in coordinates if all(not np.isnan(c) for c in coord)]),
                x_range=request.u_range,
                y_range=request.v_range,
                z_range=z_range
            ),
            evaluation_time_ms=(end_time - start_time) * 1000
        )
        
    except Exception as e:
        end_time = time.time()
        raise HTTPException(
            status_code=400, 
            detail=f"3D parametric evaluation failed: {str(e)}",
            headers={"X-Evaluation-Time-ms": str((end_time - start_time) * 1000)}
        )

@router.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {"status": "healthy", "service": "grapher-api"}

