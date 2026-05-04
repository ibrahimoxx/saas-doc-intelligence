"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { tenantService } from "@/services/tenant.service";
import type {
  TenantMembership,
  TenantMember,
  TenantPermissions,
  KnowledgeSpace,
  SpaceAccessProfile,
  UserSpaceAccess,
  UserSpaceProfileAssignment,
  UserInvitation,
} from "@/types/tenant.types";
import { TopBar } from "@/components/layout/TopBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { fadeUp, staggerContainer } from "@/lib/motion";
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
  ChevronDown,
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
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const [tenants, setTenants] = useState<TenantMembership[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
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

  useEffect(() => {
    if (isAuthenticated) {
      tenantService.myTenants().then((res) => {
        if (res.data?.length) {
          const data = res.data as unknown as TenantMembership[];
          setTenants(data);
          setSelectedTenantId(data[0].tenant.id);
        }
      });
    }
  }, [isAuthenticated]);

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

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isLoading || loadingPermissions || (!isAuthenticated && !isLoading)) return <PageLoader />;

  const isAuthorized =
    permissions?.role === "admin" ||
    permissions?.role === "owner" ||
    permissions?.can_manage_members;
  if (!isAuthorized) return null;

  const isOwner = permissions?.role === "owner" || !!user?.is_superuser;

  return (
    <div className="min-h-screen bg-bg-base">
      <TopBar
        userEmail={user?.email}
        isSuperuser={user?.is_superuser}
        tenants={tenants}
        selectedTenantId={selectedTenantId}
        onTenantChange={setSelectedTenantId}
        onLogout={handleLogout}
        onAdminDashboard={() => router.push("/admin/dashboard")}
      />

      <main id="main" className="mx-auto max-w-5xl px-6 pt-28 pb-16">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={shouldReduceMotion ? {} : staggerContainer}
          className="space-y-10"
        >
          {/* Header */}
          <motion.header
            variants={shouldReduceMotion ? { hidden: { opacity: 0 }, visible: { opacity: 1 } } : fadeUp}
            className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          >
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fg-tertiary">
                Équipe & permissions
              </p>
              <h1 className="font-serif text-4xl tracking-tight text-fg-primary sm:text-5xl">
                Membres
              </h1>
              <p className="text-sm text-fg-secondary">
                {members.length} membre{members.length !== 1 ? "s" : ""} dans cette organisation
              </p>
            </div>

            {permissions?.can_manage_members && (
              <Button
                variant="primary"
                size="md"
                leftIcon={<UserPlus className="h-4 w-4" />}
                onClick={() => setShowInviteModal(true)}
              >
                Inviter un membre
              </Button>
            )}
          </motion.header>

          {/* Member list */}
          <motion.section
            variants={shouldReduceMotion ? { hidden: { opacity: 0 }, visible: { opacity: 1 } } : fadeUp}
          >
            {loadingMembers ? (
              <div className="flex flex-col items-center justify-center gap-4 py-24">
                <div className="h-8 w-8 rounded-full border-2 border-bg-elevated-3 border-t-brand-primary animate-spin" />
                <p className="text-xs font-semibold uppercase tracking-widest text-fg-tertiary">
                  Chargement des membres…
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="overflow-hidden rounded-[20px] border border-border-subtle bg-bg-elevated-1/60"
                  >
                    {/* Member row */}
                    <div className="flex items-center gap-4 px-5 py-4">
                      <Avatar name={m.user.full_name || m.user.email} size="md" />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-fg-primary">
                          {m.user.full_name || m.user.email.split("@")[0]}
                        </p>
                        <p className="truncate text-xs text-fg-tertiary">{m.user.email}</p>
                      </div>

                      <div className="hidden sm:flex items-center gap-2">
                        <Badge
                          variant={ROLE_VARIANT[m.role] ?? "slate"}
                          dot={m.role === "owner"}
                        >
                          {m.role}
                        </Badge>
                        <Badge
                          variant={STATUS_VARIANT[m.status] ?? "slate"}
                          dot={m.status === "active"}
                          pulse={m.status === "invited"}
                        >
                          {STATUS_LABEL[m.status] ?? m.status}
                        </Badge>
                      </div>

                      {permissions?.can_manage_members && (
                        <div className="flex items-center gap-1.5">
                          {/* ACL expand toggle */}
                          <button
                            onClick={() => toggleExpand(m)}
                            className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-colors ${
                              expandedMemberId === m.id
                                ? "border-brand-primary/30 bg-brand-primary/10 text-brand-primary"
                                : "border-border-subtle bg-bg-elevated-2 text-fg-tertiary hover:text-fg-primary"
                            }`}
                            aria-label="Gérer les accès aux espaces"
                          >
                            <Key className="h-3.5 w-3.5" />
                          </button>

                          {/* Actions menu */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === m.id ? null : m.id);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border-subtle bg-bg-elevated-2 text-fg-tertiary transition-colors hover:text-fg-primary"
                              aria-label="Actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            <AnimatePresence>
                              {openMenuId === m.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                  transition={{ duration: 0.15 }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-border-subtle bg-bg-elevated-2 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.8)]"
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
                                          className="flex w-full items-center gap-3 px-4 py-3 text-xs font-semibold text-fg-secondary transition-colors hover:bg-bg-elevated-3 hover:text-fg-primary"
                                        >
                                          <Edit className="h-3.5 w-3.5 text-brand-primary" />
                                          Passer en {m.role === "admin" ? "Membre" : "Admin"}
                                        </button>
                                      )}

                                      {m.user.id !== user?.id && (
                                        <button
                                          onClick={() => handleToggleMemberStatus(m.id, m.status)}
                                          className="flex w-full items-center gap-3 px-4 py-3 text-xs font-semibold text-warning transition-colors hover:bg-warning/10"
                                        >
                                          <Shield className="h-3.5 w-3.5" />
                                          {m.status === "disabled" ? "Réactiver" : "Désactiver"}
                                        </button>
                                      )}

                                      <button
                                        onClick={() => handleRemoveMember(m.id)}
                                        className="flex w-full items-center gap-3 border-t border-border-subtle px-4 py-3 text-xs font-semibold text-error transition-colors hover:bg-error/10"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Retirer de l&apos;organisation
                                      </button>
                                    </>
                                  ) : (
                                    <p className="px-4 py-3 text-center text-xs text-fg-tertiary italic">
                                      Propriétaire — accès fixe
                                    </p>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ACL Panel */}
                    <AnimatePresence initial={false}>
                      {expandedMemberId === m.id && (
                        <motion.div
                          key="acl"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border-subtle bg-bg-elevated-2/40 px-5 py-5 space-y-6">
                            {aclLoading === m.id ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
                              </div>
                            ) : (
                              <>
                                {/* Direct space access */}
                                <div className="space-y-3">
                                  <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-fg-tertiary">
                                    <Key className="h-3 w-3 text-brand-primary" />
                                    Accès directs aux espaces
                                  </p>
                                  <div className="flex flex-wrap gap-2">
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
                                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                                            hasAccess
                                              ? "border-brand-primary/30 bg-brand-primary/10 text-brand-primary"
                                              : "border-border-subtle bg-bg-elevated-2 text-fg-tertiary hover:border-border-strong hover:text-fg-secondary"
                                          }`}
                                        >
                                          {hasAccess && <Check className="h-3 w-3" />}
                                          {space.name}
                                        </button>
                                      );
                                    })}
                                    {spaces.length === 0 && (
                                      <p className="text-xs text-fg-tertiary">
                                        Aucun espace disponible.
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Profile assignments */}
                                <div className="space-y-3 border-t border-border-subtle pt-4">
                                  <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-fg-tertiary">
                                    <Layers className="h-3 w-3 text-brand-secondary" />
                                    Profils assignés
                                  </p>
                                  <div className="flex flex-wrap gap-2">
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
                                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                                            isAssigned
                                              ? "border-brand-secondary/30 bg-brand-secondary/10 text-brand-secondary"
                                              : "border-border-subtle bg-bg-elevated-2 text-fg-tertiary hover:border-border-strong hover:text-fg-secondary"
                                          }`}
                                        >
                                          {isAssigned && <Check className="h-3 w-3" />}
                                          {profile.name}
                                        </button>
                                      );
                                    })}
                                    {profiles.length === 0 && (
                                      <p className="text-xs text-fg-tertiary">
                                        Aucun profil créé. Créez-en un dans la page Espaces.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>

          {/* Pending invitations */}
          {invitations.length > 0 && (
            <motion.section
              variants={shouldReduceMotion ? { hidden: { opacity: 0 }, visible: { opacity: 1 } } : fadeUp}
              className="space-y-4"
            >
              <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-fg-tertiary">
                <Mail className="h-3.5 w-3.5 text-warning" />
                Invitations en attente ({invitations.length})
              </h2>
              <div className="space-y-2">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-border-subtle bg-bg-elevated-1/60 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-warning/20 bg-warning/10">
                        <Mail className="h-3.5 w-3.5 text-warning" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-fg-primary">{inv.email}</p>
                        <p className="text-[10px] uppercase tracking-widest text-fg-tertiary">
                          {inv.role} · expire le{" "}
                          {new Date(inv.expires_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>

                    {permissions?.can_manage_members &&
                      (revokeSuccessId === inv.id ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-3 py-1 text-[11px] font-semibold text-success">
                          <CheckCircle2 className="h-3 w-3" />
                          Révoquée
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRevokeInvitation(inv.id)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-error/20 bg-error/10 px-3 py-1 text-[11px] font-semibold text-error transition-colors hover:bg-error/20"
                        >
                          <X className="h-3 w-3" />
                          Révoquer
                        </button>
                      ))}
                  </div>
                ))}
              </div>
            </motion.section>
          )}
        </motion.div>
      </main>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-6"
          >
            <div
              className="absolute inset-0 bg-bg-base/90 backdrop-blur-md"
              onClick={() => !inviting && closeInviteModal()}
            />

            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[32px] border border-border-subtle bg-bg-elevated-1 shadow-[0_40px_120px_-32px_rgba(0,0,0,0.9)]"
            >
              {/* Glow bar */}
              <div className="h-px w-full aurora-bg" />

              <div className="p-8">
                <div className="mb-8 flex items-start justify-between">
                  <div className="space-y-1">
                    <h2 className="font-serif text-3xl tracking-tight text-fg-primary">
                      Invitation
                    </h2>
                    <p className="text-sm text-fg-secondary">
                      Ajoutez un collaborateur à l&apos;organisation.
                    </p>
                  </div>
                  <button
                    onClick={closeInviteModal}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-subtle bg-bg-elevated-2 text-fg-tertiary transition-colors hover:text-fg-primary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {inviteSent ? (
                  <div className="space-y-6 py-4 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-success/20 bg-success/10">
                      <Mail className="h-7 w-7 text-success" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-serif text-2xl text-fg-primary">Invitation envoyée !</p>
                      <p className="text-sm text-fg-secondary">
                        Un lien d&apos;activation a été envoyé à{" "}
                        <span className="font-semibold text-fg-primary">{inviteForm.email}</span>.
                      </p>
                    </div>
                    <Button variant="ghost" onClick={closeInviteModal}>
                      Fermer
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <Input
                      type="email"
                      label="Adresse email"
                      placeholder="partenaire@entreprise.com"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    />

                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-widest text-fg-tertiary">
                        Niveau d&apos;accès
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {["member", "manager", "admin"].map((r) => (
                          <button
                            key={r}
                            onClick={() => setInviteForm({ ...inviteForm, role: r })}
                            className={`rounded-xl py-2.5 text-[11px] font-semibold uppercase tracking-widest border transition-colors ${
                              inviteForm.role === r
                                ? "border-brand-primary/40 bg-brand-primary/10 text-brand-primary"
                                : "border-border-subtle bg-bg-elevated-2 text-fg-tertiary hover:border-border-strong hover:text-fg-secondary"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    {inviteError && <ErrorBanner message={inviteError} dismissible={false} />}

                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      onClick={handleInvite}
                      loading={inviting}
                      disabled={inviting || !inviteForm.email.trim()}
                    >
                      Envoyer l&apos;invitation
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
