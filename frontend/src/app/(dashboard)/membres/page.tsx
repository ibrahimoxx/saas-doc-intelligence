"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTenants } from "@/hooks/useTenants";
import { tenantService } from "@/services/tenant.service";
import type {
  TenantMember,
  TenantPermissions,
  KnowledgeSpace,
  SpaceAccessProfile,
  UserSpaceAccess,
  UserSpaceProfileAssignment,
  UserInvitation,
} from "@/types/tenant.types";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import {
  UserPlus,
  Shield,
  ShieldCheck,
  MoreVertical,
  X,
  Mail,
  Loader2,
  Trash2,
  Edit,
  Key,
  Layers,
  Check,
  CheckCircle2,
} from "lucide-react";

const ROLE_VARIANT: Record<string, "indigo" | "blue" | "amber" | "slate"> = {
  owner: "amber",
  admin: "indigo",
  manager: "blue",
  member: "slate",
};

const STATUS_VARIANT: Record<string, "green" | "amber" | "red" | "slate"> = {
  active: "green",
  invited: "amber",
  disabled: "red",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Actif",
  invited: "Invité",
  disabled: "Désactivé",
};

export default function MembresPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const { selectedTenantId } = useTenants();
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [permissions, setPermissions] = useState<TenantPermissions | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "member" });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSent, setInviteSent] = useState(false);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Invitations
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [revokeSuccessId, setRevokeSuccessId] = useState<string | null>(null);

  // Space ACL state
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<KnowledgeSpace[]>([]);
  const [profiles, setProfiles] = useState<SpaceAccessProfile[]>([]);
  const [memberAccesses, setMemberAccesses] = useState<Record<string, UserSpaceAccess[]>>({});
  const [memberProfiles, setMemberProfiles] = useState<Record<string, UserSpaceProfileAssignment[]>>({});
  const [aclLoading, setAclLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (permissions && permissions.role !== "admin" && permissions.role !== "owner" && !permissions.can_manage_members) {
      router.replace("/dashboard");
    }
  }, [permissions, router]);

  const loadMembers = useCallback(async (tid: string) => {
    setLoadingMembers(true);
    const [membersRes, permsRes, invitationsRes] = await Promise.all([
      tenantService.listMembers(tid),
      tenantService.myPermissions(tid),
      tenantService.listInvitations(tid),
    ]);
    if (membersRes.data) setMembers(membersRes.data);
    if (permsRes.data) setPermissions(permsRes.data);
    if (invitationsRes.data) setInvitations(invitationsRes.data);
    setLoadingPermissions(false);
    setLoadingMembers(false);
  }, []);

  useEffect(() => {
    if (selectedTenantId) loadMembers(selectedTenantId);
  }, [selectedTenantId, loadMembers]);

  const handleInvite = async () => {
    if (!selectedTenantId || !inviteForm.email.trim()) return;
    setInviting(true);
    setInviteError(null);
    const res = await tenantService.sendInvitation(selectedTenantId, inviteForm.email, inviteForm.role);
    if (res.error) {
      setInviteError(res.error.message);
    } else {
      setInviteSent(true);
      loadMembers(selectedTenantId);
    }
    setInviting(false);
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setInviteForm({ email: "", role: "member" });
    setInviteError(null);
    setInviteSent(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedTenantId || !confirm("Êtes-vous sûr de vouloir retirer ce membre ?")) return;
    await tenantService.removeMember(selectedTenantId, memberId);
    loadMembers(selectedTenantId);
    setOpenMenuId(null);
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    if (!selectedTenantId) return;
    await tenantService.updateMemberRole(selectedTenantId, memberId, newRole);
    loadMembers(selectedTenantId);
    setOpenMenuId(null);
  };

  const handleToggleMemberStatus = async (memberId: string, currentStatus: string) => {
    if (!selectedTenantId) return;
    const newStatus = currentStatus === "disabled" ? "active" : "disabled";
    await tenantService.updateMemberStatus(selectedTenantId, memberId, newStatus);
    loadMembers(selectedTenantId);
    setOpenMenuId(null);
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!selectedTenantId) return;
    await tenantService.revokeInvitation(selectedTenantId, invitationId);
    setRevokeSuccessId(invitationId);
    setTimeout(() => {
      setRevokeSuccessId(null);
      loadMembers(selectedTenantId);
    }, 2000);
  };

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const loadAclData = useCallback(async (memberId: string, userId: string) => {
    if (!selectedTenantId) return;
    setAclLoading(memberId);
    const [accessRes, profileRes, spacesRes, allProfilesRes] = await Promise.all([
      tenantService.getUserSpaceAccess(selectedTenantId, memberId),
      tenantService.getUserSpaceProfiles(selectedTenantId, memberId),
      tenantService.knowledgeSpaces(selectedTenantId),
      tenantService.listSpaceProfiles(selectedTenantId),
    ]);
    if (accessRes.data) setMemberAccesses((prev) => ({ ...prev, [memberId]: accessRes.data! }));
    if (profileRes.data) setMemberProfiles((prev) => ({ ...prev, [memberId]: profileRes.data! }));
    if (spacesRes.data) setSpaces(spacesRes.data);
    if (allProfilesRes.data) setProfiles(allProfilesRes.data);
    setAclLoading(null);
  }, [selectedTenantId]);

  const toggleExpand = async (member: TenantMember) => {
    if (expandedMemberId === member.id) {
      setExpandedMemberId(null);
      return;
    }
    setExpandedMemberId(member.id);
    await loadAclData(member.id, member.user.id);
  };

  const handleGrantAccess = async (memberId: string, spaceId: string) => {
    if (!selectedTenantId) return;
    await tenantService.grantSpaceAccess(selectedTenantId, memberId, spaceId);
    await loadAclData(memberId, "");
  };

  const handleRevokeAccess = async (memberId: string, spaceId: string) => {
    if (!selectedTenantId) return;
    await tenantService.revokeSpaceAccess(selectedTenantId, memberId, spaceId);
    await loadAclData(memberId, "");
  };

  const handleAssignProfile = async (memberId: string, profileId: string) => {
    if (!selectedTenantId) return;
    await tenantService.assignSpaceProfile(selectedTenantId, memberId, profileId);
    await loadAclData(memberId, "");
  };

  const handleRemoveProfile = async (memberId: string, profileId: string) => {
    if (!selectedTenantId) return;
    await tenantService.removeSpaceProfile(selectedTenantId, memberId, profileId);
    await loadAclData(memberId, "");
  };

  if (isLoading || loadingPermissions || (!isAuthenticated && !isLoading)) return <PageLoader />;

  const isAuthorized =
    permissions?.role === "admin" ||
    permissions?.role === "owner" ||
    permissions?.can_manage_members;
  if (!isAuthorized) return null;

  const isOwner = permissions?.role === "owner" || !!user?.is_superuser;

  const roleStats = [
    { label: "Total membres", value: members.length },
    { label: "Owners", value: members.filter((m) => m.role === "owner").length },
    { label: "Admins", value: members.filter((m) => m.role === "admin").length },
    { label: "Invitations en attente", value: invitations.length },
  ];

  return (
    <div className="px-8 pb-12 pt-7">
      {/* Header */}
      <div className="mb-[18px] flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="text-[22px] font-bold text-fg-primary">Membres</h1>
          <p className="mt-1 text-[13px] text-fg-secondary">
            {members.length} membre{members.length === 1 ? "" : "s"} ·{" "}
            {invitations.length} invitation{invitations.length === 1 ? "" : "s"} en attente
          </p>
        </div>

        {permissions?.can_manage_members && (
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="dc-btn-primary"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Inviter un membre
          </button>
        )}
      </div>

      {/* Role stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {roleStats.map((s) => (
          <div key={s.label} className="dc-card px-4 py-3.5">
            <div className="dc-label">{s.label}</div>
            <div className="mt-2 text-[21px] font-bold tabular-nums text-fg-primary">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Member table */}
      {loadingMembers ? (
        <div className="dc-card flex items-center justify-center py-24">
          <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
        </div>
      ) : (
        <div className="dc-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr>
                  <th className="dc-th text-left">Membre</th>
                  <th className="dc-th text-left">Rôle</th>
                  <th className="dc-th text-left">Statut</th>
                  <th className="dc-th text-right">Accès</th>
                  <th className="dc-th w-12 text-right" />
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <Fragment key={m.id}>
                    <tr className="dc-row">
                      <td className="dc-td">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={m.user.full_name || m.user.email} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-[12.5px] font-semibold text-fg-primary">
                              {m.user.full_name || m.user.email.split("@")[0]}
                            </p>
                            <p className="truncate text-[11.5px] text-fg-tertiary">{m.user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="dc-td">
                        <Badge variant={ROLE_VARIANT[m.role] ?? "slate"} dot={m.role === "owner"}>
                          {m.role}
                        </Badge>
                      </td>

                      <td className="dc-td">
                        <Badge
                          variant={STATUS_VARIANT[m.status] ?? "slate"}
                          dot={m.status === "active"}
                          pulse={m.status === "invited"}
                        >
                          {STATUS_LABEL[m.status] ?? m.status}
                        </Badge>
                      </td>

                      <td className="dc-td text-right">
                        {permissions?.can_manage_members && (
                          <button
                            onClick={() => toggleExpand(m)}
                            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11.5px] font-semibold transition-colors ${
                              expandedMemberId === m.id
                                ? "border-transparent bg-brand-soft text-brand-primary"
                                : "border-border-subtle bg-bg-elevated-1 text-fg-secondary hover:border-border-strong hover:text-fg-primary"
                            }`}
                            aria-expanded={expandedMemberId === m.id}
                          >
                            <Key className="h-3 w-3" />
                            Espaces
                          </button>
                        )}
                      </td>

                      <td className="dc-td text-right">
                        {permissions?.can_manage_members && (
                          <div className="relative inline-block">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === m.id ? null : m.id);
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-fg-tertiary transition-colors hover:border-border-subtle hover:bg-bg-elevated-1 hover:text-fg-primary"
                              aria-label="Actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            <AnimatePresence>
                              {openMenuId === m.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  transition={{ duration: 0.12 }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-lg border border-border-subtle bg-bg-elevated-2 text-left shadow-card-lift"
                                >
                                  {m.role !== "owner" ? (
                                    <>
                                      {isOwner && (
                                        <button
                                          onClick={() =>
                                            handleUpdateRole(
                                              m.id,
                                              m.role === "admin" ? "member" : "admin"
                                            )
                                          }
                                          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-[12px] font-semibold text-fg-secondary transition-colors hover:bg-bg-elevated-1 hover:text-fg-primary"
                                        >
                                          <Edit className="h-3.5 w-3.5 text-brand-primary" />
                                          Passer en {m.role === "admin" ? "Membre" : "Admin"}
                                        </button>
                                      )}

                                      {m.user.id !== user?.id && (
                                        <button
                                          onClick={() => handleToggleMemberStatus(m.id, m.status)}
                                          className="flex w-full items-center gap-2.5 border-t border-border-subtle px-3 py-2.5 text-[12px] font-semibold text-warning transition-colors hover:bg-warning-bg"
                                        >
                                          <Shield className="h-3.5 w-3.5" />
                                          {m.status === "disabled" ? "Réactiver" : "Désactiver"}
                                        </button>
                                      )}

                                      <button
                                        onClick={() => handleRemoveMember(m.id)}
                                        className="flex w-full items-center gap-2.5 border-t border-border-subtle px-3 py-2.5 text-[12px] font-semibold text-error transition-colors hover:bg-error-bg"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Retirer de l&apos;organisation
                                      </button>
                                    </>
                                  ) : (
                                    <p className="px-3 py-2.5 text-center text-[12px] italic text-fg-tertiary">
                                      Propriétaire — accès fixe
                                    </p>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* ACL panel row */}
                    {expandedMemberId === m.id && (
                      <tr className="border-t border-border-subtle bg-bg-elevated-1">
                        <td colSpan={5} className="px-[18px] py-4">
                          {aclLoading === m.id ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Direct space access */}
                              <div>
                                <p className="dc-label flex items-center gap-1.5">
                                  <Key className="h-3 w-3 text-brand-primary" />
                                  Accès directs aux espaces
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {spaces.map((space) => {
                                    const hasAccess = memberAccesses[m.id]?.some(
                                      (a) => a.space.id === space.id
                                    );
                                    return (
                                      <button
                                        key={space.id}
                                        onClick={() =>
                                          hasAccess
                                            ? handleRevokeAccess(m.id, space.id)
                                            : handleGrantAccess(m.id, space.id)
                                        }
                                        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11.5px] font-semibold transition-colors ${
                                          hasAccess
                                            ? "border-brand-primary bg-brand-soft text-brand-primary"
                                            : "border-border-subtle bg-bg-elevated-2 text-fg-secondary hover:border-border-strong hover:text-fg-primary"
                                        }`}
                                      >
                                        {hasAccess && <Check className="h-3 w-3" />}
                                        {space.name}
                                      </button>
                                    );
                                  })}
                                  {spaces.length === 0 && (
                                    <p className="text-[12px] text-fg-tertiary">
                                      Aucun espace disponible.
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Profile assignments */}
                              <div className="border-t border-border-subtle pt-3">
                                <p className="dc-label flex items-center gap-1.5">
                                  <Layers className="h-3 w-3 text-info" />
                                  Profils assignés
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {profiles.map((profile) => {
                                    const isAssigned = memberProfiles[m.id]?.some(
                                      (a) => a.profile.id === profile.id
                                    );
                                    return (
                                      <button
                                        key={profile.id}
                                        onClick={() =>
                                          isAssigned
                                            ? handleRemoveProfile(m.id, profile.id)
                                            : handleAssignProfile(m.id, profile.id)
                                        }
                                        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11.5px] font-semibold transition-colors ${
                                          isAssigned
                                            ? "border-info-border bg-info-bg text-info"
                                            : "border-border-subtle bg-bg-elevated-2 text-fg-secondary hover:border-border-strong hover:text-fg-primary"
                                        }`}
                                      >
                                        {isAssigned && <Check className="h-3 w-3" />}
                                        {profile.name}
                                      </button>
                                    );
                                  })}
                                  {profiles.length === 0 && (
                                    <p className="text-[12px] text-fg-tertiary">
                                      Aucun profil créé. Créez-en un dans la page Espaces.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="dc-card mt-5 overflow-hidden">
          <div className="dc-panel-header">
            <span className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-warning" />
              Invitations en attente ({invitations.length})
            </span>
          </div>
          <div>
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between gap-4 border-b border-border-subtle px-[18px] py-3 last:border-b-0"
              >
                <div>
                  <p className="text-[12.5px] font-semibold text-fg-primary">{inv.email}</p>
                  <p className="text-[11.5px] text-fg-tertiary">
                    {inv.role} · expire le {new Date(inv.expires_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>

                {permissions?.can_manage_members &&
                  (revokeSuccessId === inv.id ? (
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-success-border bg-success-bg px-2.5 py-1 text-[11.5px] font-semibold text-success">
                      <CheckCircle2 className="h-3 w-3" />
                      Révoquée
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRevokeInvitation(inv.id)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-error-border bg-error-bg px-2.5 py-1 text-[11.5px] font-semibold text-error transition-colors hover:brightness-95"
                    >
                      <X className="h-3 w-3" />
                      Révoquer
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => !inviting && closeInviteModal()}
        width="max-w-lg"
      >
        {inviteSent ? (
          <div className="space-y-4 py-2 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-success-border bg-success-bg">
              <Mail className="h-5 w-5 text-success" />
            </div>
            <div className="space-y-1">
              <p className="text-[16px] font-bold text-fg-primary">Invitation envoyée</p>
              <p className="text-[13px] text-fg-secondary">
                Un lien d&apos;activation a été envoyé à{" "}
                <span className="font-semibold text-fg-primary">{inviteForm.email}</span>.
              </p>
            </div>
            <button type="button" onClick={closeInviteModal} className="dc-btn">
              Fermer
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-[17px] font-bold text-fg-primary">Inviter un membre</h2>
              <p className="mt-1 text-[13px] text-fg-secondary">
                Ajoutez un collaborateur à l&apos;organisation.
              </p>
            </div>

            <Input
              type="email"
              label="Adresse email"
              placeholder="partenaire@entreprise.com"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
            />

            <div className="space-y-1.5">
              <p className="dc-label">Niveau d&apos;accès</p>
              <div className="grid grid-cols-3 gap-2">
                {["member", "manager", "admin"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setInviteForm({ ...inviteForm, role: r })}
                    className={`rounded-md border py-2 text-[12px] font-semibold capitalize transition-colors ${
                      inviteForm.role === r
                        ? "border-brand-primary bg-brand-soft text-brand-primary"
                        : "border-border-subtle bg-bg-base text-fg-secondary hover:border-border-strong hover:text-fg-primary"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {inviteError && <ErrorBanner message={inviteError} dismissible={false} />}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeInviteModal} disabled={inviting} className="dc-btn">
                Annuler
              </button>
              <Button
                variant="primary"
                size="md"
                onClick={handleInvite}
                loading={inviting}
                disabled={inviting || !inviteForm.email.trim()}
              >
                Envoyer l&apos;invitation
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
