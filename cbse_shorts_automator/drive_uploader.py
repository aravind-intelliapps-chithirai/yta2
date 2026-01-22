import os
import sys
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
import google.auth.transport.requests

# Module-level variable to cache the service so we don't auth for every single row
_drive_service = None

def get_gdrive_service(config):
    """Handles authentication using Manual Code Input and returns the Drive service."""
    global _drive_service
    if _drive_service:
        return _drive_service

    # Extract Drive settings from your CONFIG structure
    drive_cfg = config.get('DRIVE_UPLOAD', {})
    scopes = drive_cfg.get('DRIVE_SCOPES', ['https://www.googleapis.com/auth/drive.file'])
    token_file = drive_cfg.get('DRIVE_TOKEN_FILE', 'config/drive_token.json')
    client_secret = config.get('CREDENTIALS_FILE', 'config/client_secret.json')

    creds = None
    
    # 1. Check for existing Drive token
    if os.path.exists(token_file):
        try:
            creds = Credentials.from_authorized_user_file(token_file, scopes)
            print(f"Reusing existing Drive credentials from {token_file}.")
        except Exception as e:
            print(f"WARNING: Failed to load Drive token ({e}).")

    # 2. If no valid token, initiate Manual flow
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("Refreshing Drive token...")
            try:
                creds.refresh(google.auth.transport.requests.Request())
            except Exception:
                creds = None
        
        if not creds:
            print(f"Initiating NEW Drive authorization (Manual Code Input).")
            flow = InstalledAppFlow.from_client_secrets_file(client_secret, scopes)
            # Use out-of-band flow for manual copy-paste
            flow.redirect_uri = 'urn:ietf:wg:oauth:2.0:oob'
            
            auth_url, _ = flow.authorization_url(prompt='consent')

            print("\n" + "="*60)
            print("CRITICAL AUTHORIZATION REQUIRED: GOOGLE DRIVE ACCOUNT")
            print("="*60)
            print(f"1. Please visit: {auth_url}")
            print("2. Log in with your DRIVE STORAGE account.")
            print("3. Paste the authorization code below:")
            
            code = input("Enter Drive Authorization Code: ").strip()
            flow.fetch_token(code=code)
            creds = flow.credentials

        # 3. Save Drive token
        with open(token_file, 'w') as token:
            token.write(creds.to_json())
            print(f"Drive token saved to {token_file}.")

    _drive_service = build('drive', 'v3', credentials=creds)
    return _drive_service

def get_or_create_folder_path(service, path):
    """
    Exact folder-traversal logic provided. 
    Navigates/Creates segments and returns final ID.
    """
    parts = [p for p in path.split('/') if p]
    parent_id = 'root'

    for part in parts:
        query = (f"name = '{part}' and '{parent_id}' in parents "
                 f"and mimeType = 'application/vnd.google-apps.folder' "
                 f"and trashed = false")
        
        results = service.files().list(q=query, fields='files(id)').execute()
        files = results.get('files', [])

        if files:
            parent_id = files[0]['id']
        else:
            folder_metadata = {
                'name': part,
                'mimeType': 'application/vnd.google-apps.folder',
                'parents': [parent_id]
            }
            folder = service.files().create(body=folder_metadata, fields='id').execute()
            parent_id = folder.get('id')
            print(f"Created new folder: {part}")

    return parent_id

def upload_file_to_drive(local_path, drive_name, folder_path, config):
    """
    Main entry point. Takes path from main and returns public link.
    Now requires 'config' to handle account authentication.
    """
    service = get_gdrive_service(config)

    # 1. Resolve folder path
    target_folder_id = get_or_create_folder_path(service, folder_path)

    # 2. Upload file
    file_metadata = {
        'name': drive_name,
        'parents': [target_folder_id]
    }
    media = MediaFileUpload(local_path, resumable=True)
    
    print(f"Uploading {drive_name} to Drive...")
    file = service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id, webContentLink'
    ).execute()
    
    file_id = file.get('id')

    # 3. Make the file public
    service.permissions().create(
        fileId=file_id,
        body={'type': 'anyone', 'role': 'reader'}
    ).execute()

    # 4. Get the direct download URL
    final_file = service.files().get(fileId=file_id, fields='webContentLink').execute()
    return final_file.get('webContentLink')