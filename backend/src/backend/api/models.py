from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Union, Tuple, Any
import numpy as np

class CoordinatePoint(BaseModel):
    x: float
    y: float

class CoordinatePoint3D(BaseModel):
    x: float
    y: float
    z: float

class ExpressionRequest(BaseModel):
    expression: str = Field(..., min_length=1, max_length=1000, description="Mathematical expression to evaluate")
    variables: Dict[str, float] = Field(default_factory=dict, description="Variable values for evaluation")
    x_range: Optional[Tuple[float, float]] = Field(default=(-30.0, 30.0), description="X coordinate range for evaluation")
    num_points: Optional[int] = Field(default=1000, ge=10, le=10000, description="Number of points to generate")
    t_range: Optional[Tuple[float, float]] = Field(default=(0.0, 6.283185307179586), description="Parameter range for parametric equations")
    expression_format: Optional[str] = Field(default="auto", description="Format: 'auto', 'explicit', 'implicit', 'parametric'")

class ParseRequest(BaseModel):
    expression: str = Field(..., min_length=1, max_length=1000, description="Mathematical expression to parse")

class BatchExpressionRequest(BaseModel):
    expressions: List[str] = Field(..., min_length=1, max_length=100, description="List of expressions to evaluate")
    variables: Dict[str, float] = Field(default_factory=dict, description="Common variable values")
    x_range: Optional[Tuple[float, float]] = Field(default=(-30.0, 30.0), description="X coordinate range for evaluation")
    num_points: Optional[int] = Field(default=1000, ge=10, le=10000, description="Number of points to generate")

class ParseResponse(BaseModel):
    is_valid: bool
    variables: List[str]
    error: Optional[str] = None
    expression_type: str = "mathematical"
    processed_expression: Optional[str] = None
    parameters: List[str] = Field(default_factory=list)
    primary_variable: Optional[str] = None
    classification: Optional[Dict[str, Any]] = None

class GraphDataResponse(BaseModel):
    coordinates: List[CoordinatePoint]
    total_points: int
    valid_points: int
    x_range: Tuple[float, float]
    y_range: Tuple[float, float]

class EvaluationResponse(BaseModel):
    expression: str
    graph_data: GraphDataResponse
    evaluation_time_ms: float

class BatchEvaluationResponse(BaseModel):
    results: List[EvaluationResponse]
    total_expressions: int
    total_evaluation_time_ms: float

class ParameterUpdateRequest(BaseModel):
    expression: str
    variables: Dict[str, float]
    x_range: Optional[Tuple[float, float]] = Field(default=(-30.0, 30.0))

class ParametricRequest(BaseModel):
    x_expression: str = Field(..., description="X component of parametric equation x(t)")
    y_expression: str = Field(..., description="Y component of parametric equation y(t)")
    variables: Dict[str, float] = Field(default_factory=dict, description="Parameter values")
    t_range: Optional[Tuple[float, float]] = Field(default=(0.0, 6.283185307179586), description="Parameter t range")
    num_points: Optional[int] = Field(default=1000, ge=10, le=10000, description="Number of points to generate")

# 3D Graphing Models
class Surface3DRequest(BaseModel):
    expression: str = Field(..., min_length=1, max_length=1000, description="3D surface expression z = f(x, y)")
    variables: Dict[str, float] = Field(default_factory=dict, description="Variable values for evaluation")
    x_range: Optional[Tuple[float, float]] = Field(default=(-10.0, 10.0), description="X coordinate range")
    y_range: Optional[Tuple[float, float]] = Field(default=(-10.0, 10.0), description="Y coordinate range")
    resolution: Optional[int] = Field(default=50, ge=10, le=200, description="Grid resolution for surface")

class Parametric3DRequest(BaseModel):
    x_expression: str = Field(..., description="X component x(u, v)")
    y_expression: str = Field(..., description="Y component y(u, v)")
    z_expression: str = Field(..., description="Z component z(u, v)")
    u_range: Optional[Tuple[float, float]] = Field(default=(0.0, 6.283185307179586), description="Parameter u range")
    v_range: Optional[Tuple[float, float]] = Field(default=(0.0, 6.283185307179586), description="Parameter v range")
    resolution: Optional[int] = Field(default=50, ge=10, le=200, description="Grid resolution for parametric surface")
    variables: Dict[str, float] = Field(default_factory=dict, description="Additional parameter values")

class GraphData3DResponse(BaseModel):
    coordinates: List[CoordinatePoint3D]
    total_points: int
    valid_points: int
    x_range: Tuple[float, float]
    y_range: Tuple[float, float]
    z_range: Tuple[float, float]

class Evaluation3DResponse(BaseModel):
    expression: str
    graph_type: str  # "surface" or "parametric"
    graph_data: GraphData3DResponse
    evaluation_time_ms: float

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    error_code: Optional[str] = None