"""Generate complete LMS setup - fixed version"""
import os, re

base = r'C:\Users\HARIHARAN S\OneDrive\Desktop\inten hub\skyrovix-pathway\supabase\migrations'
out_fn = r'C:\Users\HARIHARAN S\OneDrive\Desktop\inten hub\skyrovix-pathway\complete_setup.sql'

def safe(sql):
    sql = re.sub(r'CREATE TYPE (public\.\w+) AS ENUM \((.*?)\);',
        lambda m: f'DO $$ BEGIN CREATE TYPE {m.group(1)} AS ENUM ({m.group(2)}); EXCEPTION WHEN duplicate_object THEN NULL; END $$;', sql)
    sql = re.sub(r"ALTER TYPE (public\.\w+) ADD VALUE '(\w+)'(.*?);",
        lambda m: f"DO $$ BEGIN ALTER TYPE {m.group(1)} ADD VALUE '{m.group(2)}'{m.group(3)}; EXCEPTION WHEN duplicate_object THEN NULL; END $$;", sql)
    sql = re.sub(r'CREATE TABLE (public\.\w+)', r'CREATE TABLE IF NOT EXISTS \1', sql)
    sql = re.sub(r'ALTER TABLE (.+?) ADD COLUMN (?!IF NOT EXISTS)', r'ALTER TABLE \1 ADD COLUMN IF NOT EXISTS ', sql)
    sql = re.sub(r"INSERT INTO storage\.buckets \(id, name, public\) VALUES \('([^']+)', '([^']+)', (true|false)\)(?!\s*ON CONFLICT)",
        r"INSERT INTO storage.buckets (id, name, public) VALUES ('\1', '\2', \3) ON CONFLICT (id) DO NOTHING", sql)
    sql = re.sub(r'CREATE TRIGGER \w+[\s\S]+?EXECUTE FUNCTION public\.\w+\(\);', '', sql)
    sql = re.sub(r'DROP TRIGGER IF EXISTS \w+ ON [\w.]+;', '', sql)
    return sql

mig_files = [
    '20260615124725_4485fbfc-ca01-41e0-8269-1ee84256e72b.sql',
    '20260615124748_ab1b8349-d021-4dd2-a4ca-a4b3f9feba88.sql',
    '20260620152643_29d9ea0d-a546-492e-bd07-2b273ffcf27b.sql',
    '20260620153212_6ae526c8-a1b9-4051-aad0-143eb5988a0d.sql',
    '20260620164000_fix_has_role_permissions.sql',
    '20260621000000_add_internship_statuses.sql',
    '20260621000001_fix_task_number_check.sql',
    '20260621000003_seed_linkedin_task.sql',
    '20260621000004_add_submission_files.sql',
    '20260622000001_rpc_ensure_linkedin_task.sql',
    '20260622000002_create_payment_storage_buckets.sql',
    '20260622000003_lms_enhancements.sql',
]

seed_path = os.path.join(base, '20260622000004_seed_course_topics.sql')
with open(seed_path, 'r', encoding='utf-8') as f:
    raw_seed = f.read()

def rebuild_insert(values_text, course_slug):
    """Rebuild a single topic INSERT with dollar-quoting. 
    values_text looks like: "SELECT id, N, 'TITLE', 'CONTENT...', 'CODE...', ARRAY[...]"
    """
    values_text = values_text.strip()
    
    # Extract order_index and title
    m = re.match(r"SELECT\s+id,\s*(\d+),\s*'([^']*)',\s*'", values_text, re.DOTALL)
    if not m:
        return None
    order_idx = m.group(1)
    title = m.group(2)
    
    # Everything after the title's closing "', '"
    rest = values_text[m.end():]  # starts with content_md
    
    # Find content_md end: it's closed by "', '" or "',  " (code_example start)
    # Then code_example is closed by "', ARRAY["
    
    # Find: content_md', 'code_example', ARRAY[...]
    # Or: content_md', ARRAY[...] (no code_example)
    
    # First find the ARRAY at the end
    array_match = re.search(r",\s*ARRAY\[", rest)
    if not array_match:
        return None
    
    arr_start = array_match.start()
    # Find closing bracket to get only the ARRAY part, not the trailing FROM/ON CONFLICT
    arr_end = rest.find(']', arr_start)
    if arr_end == -1:
        return None
    key_points_raw = rest[arr_start:arr_end+1].strip()
    # Remove leading comma
    if key_points_raw.startswith(','):
        key_points_raw = key_points_raw[1:].strip()
    
    values_before_arr = rest[:arr_start].strip()
    
    # Now values_before_arr is: 'CONTENT_MD', 'CODE_EXAMPLE'  or just 'CONTENT_MD'
    # Split by last "'", "'" to get content_md and code_example
    
    # Find: content ends with ', and code starts with '
    # The separator is: ', '
    sep = values_before_arr.rfind("', '")
    if sep >= 0:
        content_md = values_before_arr[:sep].strip().strip("'")
        code_example = values_before_arr[sep+4:].strip().strip("'")
    else:
        content_md = values_before_arr.strip().strip("'")
        code_example = ''
    
    # Handle empty code_example (the original might have been '', or empty)
    # Build the clean INSERT - FIXED: no extra comma before key_points_raw
    insert = f"""INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)
SELECT id, {order_idx}, $t${title}$t$, $md${content_md}$md$, $ce${code_example}$ce$, {key_points_raw}
FROM public.courses WHERE slug = '{course_slug}'
ON CONFLICT (course_id, order_index) DO NOTHING;"""
    
    return insert


# Split seed file into blocks
blocks = raw_seed.split('INSERT INTO public.course_topics (course_id, order_index, title, content_md, code_example, key_points)')
courses_insert = blocks[0]

all_inserts = []
for block in blocks[1:]:
    # Extract course slug
    slug_m = re.search(r"slug\s*=\s*'(\w+)'", block)
    course_slug = slug_m.group(1) if slug_m else 'python'
    
    # Split into individual topics by "SELECT id,"
    parts = block.split('SELECT id,')
    for part in parts[1:]:
        full = f"SELECT id,{part}"
        rebuilt = rebuild_insert(full, course_slug)
        if rebuilt:
            all_inserts.append(rebuilt)

# Write output
with open(out_fn, 'w', encoding='utf-8', newline='\r\n') as f:
    f.write('/* === SKYROVIX LMS - COMPLETE SETUP === */\n\n')
    
    for fn in mig_files:
        path = os.path.join(base, fn)
        with open(path, 'r', encoding='utf-8') as src:
            sql = safe(src.read())
        f.write(f'-- {fn}\n{sql}\n\n')
    
    f.write('-- SEED COURSES\n')
    if 'ON CONFLICT' not in courses_insert:
        courses_insert = courses_insert.rstrip(';\n') + '\nON CONFLICT (slug) DO NOTHING;\n'
    f.write(courses_insert + '\n\n')
    
    f.write('-- SEED TOPICS\n')
    for ins in all_inserts:
        f.write(ins + '\n\n')
    
    f.write('-- ADD AUTH TRIGGER\n')
    f.write("""DO $do$ BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION WHEN OTHERS THEN NULL;
END $do$;
""")
    
    # Topic counts
    for slug in ['python', 'java', 'html', 'css', 'javascript', 'php', 'sql']:
        f.write(f"UPDATE public.courses SET total_topics = (SELECT COUNT(*) FROM public.course_topics WHERE course_id = (SELECT id FROM public.courses WHERE slug = '{slug}')) WHERE slug = '{slug}';\n")

print(f'Done: {out_fn}')
with open(out_fn, 'r') as cf:
    text = cf.read()
    print(f'Size: {len(text)} bytes')
    print(f'Topics: {len(all_inserts)}')
    print(f'$md$ pairs: {text.count("$md$") // 2}')
    print(f'$ce$ pairs: {text.count("$ce$") // 2}')
    
    # Verify no double commas in the pattern
    import re
    bad = re.findall(r'\$ce\$, \$, ARRAY', text)
    if bad:
        print(f'WARNING: Found {len(bad)} double-comma issues!')
    else:
        print('No double-comma issues found.')
