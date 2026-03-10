-- Find the user ID
DO $$ 
DECLARE 
    v_user_id UUID;
    v_tenant_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM core_user WHERE email = 'user@docpilot.dev';
    SELECT id INTO v_tenant_id FROM tenancy_tenant LIMIT 1;

    IF v_user_id IS NOT NULL AND v_tenant_id IS NOT NULL THEN
        -- Insert membership if not exists
        IF NOT EXISTS (SELECT 1 FROM tenancy_tenantmembership WHERE user_id = v_user_id AND tenant_id = v_tenant_id) THEN
            INSERT INTO tenancy_tenantmembership (id, created_at, updated_at, role, is_active, tenant_id, user_id)
            VALUES (gen_random_uuid(), now(), now(), 'member', true, v_tenant_id, v_user_id);
            RAISE NOTICE 'Added membership';
        ELSE
            RAISE NOTICE 'Membership already exists';
        END IF;
    ELSE
        RAISE NOTICE 'Could not find user or tenant';
    END IF;
END $$;
