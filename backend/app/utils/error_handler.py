from flask import jsonify
from backend.app.utils.logger import export_logger as logger

class APIError(Exception):
    """API错误异常类"""
    def __init__(self, message, status_code=500, error_code="INTERNAL_SERVER_ERROR"):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(self.message)

class ValidationError(APIError):
    """验证错误异常类"""
    def __init__(self, message, error_code="VALIDATION_ERROR"):
        super().__init__(message, 400, error_code)

class NotFoundError(APIError):
    """资源未找到错误异常类"""
    def __init__(self, message, error_code="NOT_FOUND"):
        super().__init__(message, 404, error_code)

class UnauthorizedError(APIError):
    """未授权错误异常类"""
    def __init__(self, message, error_code="UNAUTHORIZED"):
        super().__init__(message, 401, error_code)

class ForbiddenError(APIError):
    """禁止访问错误异常类"""
    def __init__(self, message, error_code="FORBIDDEN"):
        super().__init__(message, 403, error_code)

class RateLimitExceededError(APIError):
    """超出速率限制错误异常类"""
    def __init__(self, message, error_code="RATE_LIMIT_EXCEEDED"):
        super().__init__(message, 429, error_code)

class ThirdPartyAPIError(APIError):
    """第三方API错误异常类"""
    def __init__(self, message, status_code=502, error_code="THIRD_PARTY_API_ERROR"):
        super().__init__(message, status_code, error_code)

def handle_api_error(error):
    """处理API错误"""
    logger.error(f"API Error: {error.error_code} - {error.message}", exc_info=True)
    response = {
        "error": {
            "code": error.error_code,
            "message": error.message
        }
    }
    return jsonify(response), error.status_code

def handle_generic_error(error):
    """处理通用错误"""
    logger.error(f"Generic Error: {str(error)}", exc_info=True)
    response = {
        "error": {
            "code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred"
        }
    }
    return jsonify(response), 500

def register_error_handlers(app):
    """注册错误处理器"""
    app.register_error_handler(APIError, handle_api_error)
    app.register_error_handler(Exception, handle_generic_error)
