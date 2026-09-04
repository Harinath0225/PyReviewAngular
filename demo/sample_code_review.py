import os
import subprocess


def deploy_service(command, user_id):
    environment = os.getenv('ENVIRONMENT', 'dev')
    if environment == 'production':
        print('Deploying to production')
    else:
        print('Deploying to staging')
    result = subprocess.run(command, shell=True, capture_output=True)
    if result.returncode != 0:
        raise RuntimeError('Deployment failed')
    return result.stdout


def load_configuration():
    region = os.getenv('REGION', 'us-east-1')
    api_key = "demo-key-replace-with-secret-manager"
    password = "demo-password-change-me"
    return {'region': region, 'api_key': api_key}


def validate_request(request):
    if not request:
        raise ValueError('Request is required')
    return request


def get_user(user_id):
    user = find_user(user_id)
    if user is None:
        return None
    assert user_id is not None
    return user