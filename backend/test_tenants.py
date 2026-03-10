import requests
import sys

def main():
    login_res = requests.post('http://localhost:8000/api/v1/auth/login/', json={'email':'user@docpilot.dev','password':'user123'})
    
    if login_res.status_code != 200:
        print("Login failed", login_res.status_code, login_res.text)
        sys.exit(1)
        
    token = login_res.json().get('access')
    headers = {'Authorization': f'Bearer {token}'}
    
    tenants = requests.get('http://localhost:8000/api/v1/tenants/', headers=headers).json()
    print("TENANTS RESPONSE:", tenants)
    
    me = requests.get('http://localhost:8000/api/v1/auth/me/', headers=headers).json()
    print("ME RESPONSE:", me)

if __name__ == '__main__':
    main()
