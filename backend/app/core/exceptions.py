class AITimeoutException(Exception):
    def __init__(self, message="The AI provider took too long to respond."):
        self.message = message
        super().__init__(self.message)

class AIRateLimitException(Exception):
    def __init__(self, message="AI provider rate limit exceeded."):
        self.message = message
        super().__init__(self.message)

class AIConfigurationException(Exception):
    def __init__(self, message="AI provider is not properly configured."):
        self.message = message
        super().__init__(self.message)

class AIBadRequestException(Exception):
    def __init__(self, message="Invalid request sent to AI provider."):
        self.message = message
        super().__init__(self.message)
