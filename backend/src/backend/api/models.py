from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Union, Tuple, Any

class CoordinatePoint(BaseModel):
    x: float
    y: float

class ExpressionRequest(BaseModel):
    expression: str = Field(..., min_length=1, max_length=1000, description="Mathematical expression to evaluate")
    variables: Dict[str, float] = Field(default_factory=dict, description="Variable values for evaluation")
    x_range: Optional[Tuple[float, float]] = Field(default=(-5.0, 5.0), description="X coordinate range for evaluation")
    num_points: Optional[int] = Field(default=1000, ge=10, le=10000, description="Number of points to generate")

class ParseRequest(BaseModel):
    expression: str = Field(..., min_length=1, max_length=1000, description="Mathematical expression to parse")

class BatchExpressionRequest(BaseModel):
    expressions: List[str] = Field(..., min_items=1, max_items=100, description="List of expressions to evaluate")
    variables: Dict[str, float] = Field(default_factory=dict, description="Common variable values")
    x_range: Optional[Tuple[float, float]] = Field(default=(-5.0, 5.0), description="X coordinate range for evaluation")
    num_points: Optional[int] = Field(default=1000, ge=10, le=10000, description="Number of points to generate")

class ParseResponse(BaseModel):
    is_valid: bool
    variables: List[str]
    error: Optional[str] = None
    expression_type: str = "mathematical"

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
    x_range: Optional[Tuple[float, float]] = Field(default=(-5.0, 5.0))

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    error_code: Optional[str] = None