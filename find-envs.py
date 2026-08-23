import os

def search_files(directory):
    for root, dirs, files in os.walk(directory):
        # Exclude list
        skip_dirs = ['node_modules', '.git', 'venv', '.next', 'dist', 'build', '.cache', '.github']
        for sd in skip_dirs:
            if sd in dirs:
                dirs.remove(sd)
            
        for file in files:
            full_path = os.path.join(root, file)
            # Find any .env file
            if file.startswith('.env') or 'config' in file.lower() or 'schema' in file.lower():
                print('Found config/schema candidate:', full_path)
            
            # Search content of readable files for database URLs or keys
            if file.endswith(('.js', '.ts', '.py', '.json', '.env', '.txt', '.sql', '.yml', '.yaml')):
                try:
                    with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        if 'VITE_SUPABASE_URL' in content or 'DATABASE_URL' in content or 'supabase.co' in content:
                            print('Matches content keywords:', full_path)
                except Exception:
                    pass

for d in ["official", "fwd", "vinix"]:
    p = f"c:\\Users\\vishal6385\\Desktop\\{d}"
    if os.path.exists(p):
        print(f"Searching {p}...")
        search_files(p)
print("Finished targeted search.")
