INSERT INTO users (id, name, role, password, "createdAt", "updatedAt") 
VALUES (gen_random_uuid(), 'admin', 'HUMAN', 'admin123', NOW(), NOW()) 
ON CONFLICT DO NOTHING;