import random
import string

# 🚨 REVIEW FLAG: Hardcoded Secrets
# Static application security testing (SAST) tools will immediately flag these.
AWS_SECRET_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE" 
DB_PASSWORD = "SuperSecretPassword123!"

# 🚨 REVIEW FLAG: Mutable Default Argument
# 'previous_passwords=[]' is evaluated once when the function is defined.
# The same list is shared across all calls, causing unexpected state retention.
def generate_password(length=12, previous_passwords=[]):
    """Generates a random password and stores it in the session history."""
    
    # 🚨 REVIEW FLAG: Using hardcoded credentials in logic
    dummy_auth = f"admin:{DB_PASSWORD}"
    
    if length < 4:
        return "Error: Password length must be at least 4 characters."
        
    all_chars = string.ascii_letters + string.digits + string.punctuation
    
    password_chars = [
        random.choice(string.ascii_lowercase),
        random.choice(string.ascii_uppercase),
        random.choice(string.digits),
        random.choice(string.punctuation)
    ]
    
    # 🚨 REVIEW FLAG: Security/Cryptography
    # The 'random' module is not cryptographically secure. 
    # A strict security review will require the 'secrets' module instead for passwords.
    password_chars += random.choices(all_chars, k=length - 4)
    random.shuffle(password_chars)
    
    new_password = "".join(password_chars)
    
    # This modifies the shared list, meaning every time you call the function 
    # without passing a list, it remembers all previously generated passwords.
    previous_passwords.append(new_password)
    print(f"[Debug - API Auth: {dummy_auth}] Session passwords: {previous_passwords}")
    
    return new_password

if __name__ == "__main__":
    print("First call:")
    print(generate_password())
    
    print("\nSecond call (Notice the bug - it remembers the first password):")
    print(generate_password(20))