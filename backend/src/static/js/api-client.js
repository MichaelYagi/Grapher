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

    async evaluate3DSurface(expression, variables = {}, xRange = [-10, 10], yRange = [-10, 10], resolution = 50) {
        return this.makeRequest('/api/surface-3d', 'POST', {
            expression,
            variables,
            x_range: xRange,
            y_range: yRange,
            resolution
        });
    }

    async evaluate3DParametric(xExpression, yExpression, zExpression, variables = {}, uRange = [0, 6.283185307179586], vRange = [0, 6.283185307179586], resolution = 50) {
        return this.makeRequest('/api/parametric-3d', 'POST', {
            x_expression: xExpression,
            y_expression: yExpression,
            z_expression: zExpression,
            variables,
            u_range: uRange,
            v_range: vRange,
            resolution
        });
    }

    async healthCheck() {
        return this.makeRequest('/api/health');
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
const apiClient = new ApiClient('http://192.168.0.185:8001');