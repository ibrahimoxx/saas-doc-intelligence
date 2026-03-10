import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.contrib.auth import get_user_model
from apps.tenancy.models import Tenant, TenantMembership

User = get_user_model()

def main():
    email = 'user@docpilot.dev'
    password = 'user123'
    
    print("\n--- SCRIPT DE CORRECTION UTILISATEUR ---\n")
    
    # 1. Obtenir ou créer l'utilisateur
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'full_name': 'Test Utilisateur',
            'is_active': True,
        }
    )
    
    # 2. Forcer le mot de passe
    user.set_password(password)
    user.save()
    
    if created:
        print(f"✅ Utilisateur {email} créé avec succès.")
    else:
        print(f"ℹ️ Utilisateur {email} existe déjà, mot de passe réinitialisé.")

    # 3. Trouver le premier Tenant (Organisation)
    tenant = Tenant.objects.first()
    if not tenant:
        print("❌ ERREUR: Aucune organisation (Tenant) n'existe dans la base de données ! Créez d'abord un admin.")
        sys.exit(1)

    # 4. Forcer l'ajout au Tenant
    membership, mem_created = TenantMembership.objects.get_or_create(
        user=user,
        tenant=tenant,
        defaults={
            'role': 'member',
            'status': 'active'
        }
    )
    
    # 5. Forcer le status 'active' qu'il soit créé ou non
    if membership.status != 'active':
        membership.status = 'active'
        membership.save()
        print(f"🔄 Statut d'appartenance corrigé en 'active' pour {email}.")

    print(f"✅ SUCCÈS : L'utilisateur {email} est membre de '{tenant.name}' !")
    print("\nVous pouvez maintenant vous connecter sur le frontend.\n")

if __name__ == '__main__':
    main()
