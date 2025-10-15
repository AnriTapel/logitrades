import os

def _get_env_var(var: str) -> str:
    secret = os.getenv(var)
    if not secret:
        raise RuntimeError(
            f"{var} env variable is not set. Define it in your environment or .env file."
        )
    return secret