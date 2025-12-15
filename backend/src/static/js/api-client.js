class ApiClient {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
        this.timeout = 10000; // 10 second timeout
    }

    async makeRequest(endpoint, method = 'GET', data = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(this.timeout)
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            config.body = JSON.stringify(data);
            console.log('API Request:', endpoint, JSON.stringify(data, null, 2)); // Debug log
        }

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error Details:', JSON.stringify(errorData, null, 2)); // Debug log
                const errorMessage = Array.isArray(errorData.detail) 
                    ? errorData.detail.map(err => `${err.loc?.join('.')}: ${err.msg}`).join('; ')
                    : errorData.detail || errorData.error || `HTTP ${response.status}`;
                throw new ApiError(errorMessage, response.status, errorData.error_code);
            }

            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new ApiError('Request timeout', 408, 'TIMEOUT');
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(`Network error: ${error.message}`, 0, 'NETWORK_ERROR');
        }
    }

    async parseExpression(expression) {
        return this.makeRequest('/api/parse', 'POST', { expression });
    }

    async evaluateExpression(expression, variables = {}, xRange = [-30, 30], numPoints = 1000) {
        return this.makeRequest('/api/evaluate', 'POST', {
            expression,
            variables,
            x_range: xRange,
            num_points: numPoints
        });
    }

    async batchEvaluate(expressions, variables = {}, xRange = [-30, 30], numPoints = 1000) {
        return this.makeRequest('/api/batch-evaluate', 'POST', {
            expressions,
            variables,
            x_range: xRange,
            num_points: numPoints
        });
    }

    async updateParameters(expression, variables, xRange = [-30, 30]) {
        return this.makeRequest('/api/update-params', 'POST', {
            expression,
            variables,
            x_range: xRange
        });
    }

    async healthCheck() {
        return this.makeRequest('/api/health');
    }

    async evaluateParametric(xExpression, yExpression, variables = {}, tRange = [0, 2*Math.PI], numPoints = 1000) {
        return this.makeRequest('/api/parametric', 'POST', {
            x_expression: xExpression,
            y_expression: yExpression,
            variables: variables,
            t_range: tRange,
            num_points: numPoints
        });
    }

    // Debounced parameter update for real-time updates
    createDebouncedParameterUpdate(delay = 300) {
        let timeoutId;
        let lastRequestAbortController;

        return async (expression, variables, xRange, callback) => {
            // Cancel previous request if still pending
            if (lastRequestAbortController) {
                lastRequestAbortController.abort();
            }

            // Clear existing timeout
            clearTimeout(timeoutId);

            // Set new timeout
            timeoutId = setTimeout(async () => {
                try {
                    // Create new abort controller for this request
                    lastRequestAbortController = new AbortController();
                    
                    const result = await this.evaluateExpression(
                        expression, 
                        variables, 
                        xRange, 
                        1000 // Use fewer points for real-time updates
                    );
                    
                    callback(null, result);
                } catch (error) {
                    // Don't treat abort as an error
                    if (error.name !== 'AbortError') {
                        callback(error);
                    }
                }
            }, delay);
        };
    }

    // Batch multiple requests efficiently
    async batchRequest(requests) {
        const promises = requests.map(request => {
            const { endpoint, method = 'GET', data } = request;
            return this.makeRequest(endpoint, method, data);
        });

        try {
            return await Promise.all(promises);
        } catch (error) {
            // If any request fails, return the partial results with errors
            const results = await Promise.allSettled(promises);
            return results.map(result => {
                if (result.status === 'fulfilled') {
                    return { success: true, data: result.value };
                } else {
                    return { 
                        success: false, 
                        error: result.reason.message || 'Unknown error',
                        status: result.reason.status || 0
                    };
                }
            });
        }
    }
}

class ApiError extends Error {
    constructor(message, status = 0, errorCode = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.errorCode = errorCode;
    }

    isTimeout() {
        return this.status === 408 || this.errorCode === 'TIMEOUT';
    }

    isNetworkError() {
        return this.status === 0 || this.errorCode === 'NETWORK_ERROR';
    }

    isServerError() {
        return this.status >= 500;
    }

    isClientError() {
        return this.status >= 400 && this.status < 500;
    }
}

// Create global API client instance
const apiClient = new ApiClient();