"""
DocPilot AI — Core Constants

Shared enums and constants used across modules.
"""


# ===========================
# Tenant Membership Roles
# ===========================
class TenantRole:
    OWNER = "owner"
    ADMIN = "admin"
    MANAGER = "manager"
    MEMBER = "member"

    CHOICES = [
        (OWNER, "Propriétaire"),
        (ADMIN, "Administrateur"),
        (MANAGER, "Gestionnaire"),
        (MEMBER, "Membre"),
    ]

    ADMIN_ROLES = [OWNER, ADMIN]
    MANAGER_ROLES = [OWNER, ADMIN, MANAGER]
    ALL_ROLES = [OWNER, ADMIN, MANAGER, MEMBER]


# ===========================
# Tenant Membership Status
# ===========================
class MembershipStatus:
    ACTIVE = "active"
    INVITED = "invited"
    DISABLED = "disabled"

    CHOICES = [
        (ACTIVE, "Actif"),
        (INVITED, "Invité"),
        (DISABLED, "Désactivé"),
    ]


# ===========================
# Tenant Status
# ===========================
class TenantStatus:
    ACTIVE = "active"
    SUSPENDED = "suspended"
    TRIAL = "trial"

    CHOICES = [
        (ACTIVE, "Actif"),
        (SUSPENDED, "Suspendu"),
        (TRIAL, "Essai"),
    ]


# ===========================
# Document Status
# ===========================
class DocumentStatus:
    QUEUED = "queued"
    PROCESSING = "processing"
    INDEXED = "indexed"
    FAILED = "failed"

    CHOICES = [
        (QUEUED, "En attente"),
        (PROCESSING, "En traitement"),
        (INDEXED, "Indexé"),
        (FAILED, "Échoué"),
    ]


# ===========================
# Processing Job Types
# ===========================
class JobType:
    INDEX = "index"
    REINDEX = "reindex"
    DELETE_INDEX = "delete_index"

    CHOICES = [
        (INDEX, "Indexation"),
        (REINDEX, "Réindexation"),
        (DELETE_INDEX, "Suppression index"),
    ]


# ===========================
# Processing Job Status
# ===========================
class JobStatus:
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"

    CHOICES = [
        (QUEUED, "En attente"),
        (RUNNING, "En cours"),
        (SUCCEEDED, "Réussi"),
        (FAILED, "Échoué"),
    ]


# ===========================
# Message Roles
# ===========================
class MessageRole:
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

    CHOICES = [
        (USER, "Utilisateur"),
        (ASSISTANT, "Assistant"),
        (SYSTEM, "Système"),
    ]


# ===========================
# Response Status
# ===========================
class ResponseStatus:
    OK = "ok"
    NO_ANSWER = "no_answer"
    ERROR = "error"

    CHOICES = [
        (OK, "Succès"),
        (NO_ANSWER, "Sans réponse"),
        (ERROR, "Erreur"),
    ]


# ===========================
# Conversation Status
# ===========================
class ConversationStatus:
    ACTIVE = "active"
    ARCHIVED = "archived"

    CHOICES = [
        (ACTIVE, "Active"),
        (ARCHIVED, "Archivée"),
    ]


# ===========================
# Audit Log Actions
# ===========================
class AuditAction:
    # Auth
    LOGIN = "login"
    LOGOUT = "logout"
    TOKEN_REFRESH = "token_refresh"

    # Users
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"

    # Tenants
    TENANT_CREATED = "tenant_created"
    MEMBER_ADDED = "member_added"
    MEMBER_REMOVED = "member_removed"
    ROLE_CHANGED = "role_changed"

    # Documents
    DOCUMENT_UPLOADED = "document_uploaded"
    DOCUMENT_DELETED = "document_deleted"
    DOCUMENT_REINDEXED = "document_reindexed"

    # RAG
    QUESTION_ASKED = "question_asked"

    # Space ACL
    SPACE_ACCESS_GRANTED = "space_access_granted"
    SPACE_ACCESS_REVOKED = "space_access_revoked"
    SPACE_PROFILE_CREATED = "space_profile_created"
    SPACE_PROFILE_DELETED = "space_profile_deleted"
    SPACE_PROFILE_ASSIGNED = "space_profile_assigned"
    SPACE_PROFILE_REMOVED = "space_profile_removed"

    # Admin
    ADMIN_ACTION = "admin_action"


# ===========================
# Model Usage Types
# ===========================
class ModelUsageType:
    EMBEDDING = "embedding"
    GENERATION = "generation"

    CHOICES = [
        (EMBEDDING, "Embedding"),
        (GENERATION, "Génération"),
    ]


# ===========================
# Query Log Status
# ===========================
class QueryStatus:
    OK = "ok"
    NO_ANSWER = "no_answer"
    ERROR = "error"
    TIMEOUT = "timeout"

    CHOICES = [
        (OK, "Succès"),
        (NO_ANSWER, "Sans réponse"),
        (ERROR, "Erreur"),
        (TIMEOUT, "Timeout"),
    ]
