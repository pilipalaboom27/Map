import logging
import os
from datetime import datetime
from backend.app.config import config

# 创建日志目录
log_dir = "logs"
os.makedirs(log_dir, exist_ok=True)

# 创建日志文件路径
log_file = os.path.join(log_dir, f"knowledge_map_{datetime.now().strftime('%Y-%m-%d')}.log")

# 创建日志记录器
logger = logging.getLogger(config.APP_NAME)
# 确保日志级别是字符串转换为logging级别
log_level = getattr(logging, config.LOG_LEVEL.upper(), logging.INFO)
logger.setLevel(log_level)

# 创建控制台处理器
console_handler = logging.StreamHandler()
console_handler.setLevel(log_level)

# 创建文件处理器
file_handler = logging.FileHandler(log_file, encoding='utf-8')
file_handler.setLevel(log_level)

# 创建日志格式化器
formatter = logging.Formatter(config.LOG_FORMAT)

# 设置处理器的格式化器
console_handler.setFormatter(formatter)
file_handler.setFormatter(formatter)

# 添加处理器到记录器
logger.addHandler(console_handler)
logger.addHandler(file_handler)

# 导出日志记录器
export_logger = logger
