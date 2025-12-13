from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
import time
import asyncio
from typing import List

from backend.api.models import (
    ExpressionRequest, ParseRequest, BatchExpressionRequest, ParameterUpdateRequest,
    ParseResponse, EvaluationResponse, BatchEvaluationResponse, ErrorResponse
)
from backend.core.math_engine import evaluator
from backend.core.cache import get_cache, generate_cache_key
from backend.core.config import settings

router = APIRouter()

@router.post("/parse", response_model=ParseResponse)
async def parse_expression(request: ParseRequest):
    """
    Parse a mathematical expression and extract variables.
    """
    try:
        # Validate expression
        is_valid, error_msg = evaluator.parser.validate_expression(request.expression)
        
        if not is_valid:
            return ParseResponse(
                is_valid=False,
                variables=[],
                error=error_msg
            )
        
        # Extract variables
        variables = list(evaluator.parser.extract_variables(request.expression))
        
        return ParseResponse(
            is_valid=True,
            variables=variables
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_expression(request: ExpressionRequest):
    """
    Evaluate a mathematical expression and generate graph data.
    """
    start_time = time.time()
    
    try:
        # Check cache first
        cache_key = generate_cache_key(request.expression, request.variables, request.x_range)
        cache = get_cache()
        cached_result = await cache.get(cache_key) if cache else None
        
        if cached_result:
            return cached_result
        
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

@router.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {"status": "healthy", "service": "grapher-api"}

