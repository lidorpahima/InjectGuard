"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { LLM_PROVIDERS, IS_OTHER, MODELS_BY_PROVIDER, PROVIDER_IDS } from "@/utils/constants/providers";
import { CopyIcon, KeyRoundIcon, Loader2Icon, PencilIcon, Trash2Icon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type KeyItem = {
    id: string;
    gatewayKeyMasked: string;
    provider: string;
    providerName: string;
    model: string | null;
    name: string | null;
    createdAt: string;
};

type NewKeyResult = {
    gatewayKey: string;
    provider: string;
    providerName: string;
    model: string | null;
};

export default function ApiKeysPage() {
    const [keys, setKeys] = useState<KeyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newKeyShown, setNewKeyShown] = useState<NewKeyResult | null>(null);
    const [provider, setProvider] = useState<string>("");
    const [providerCustomName, setProviderCustomName] = useState("");
    const [model, setModel] = useState("");
    const [modelCustom, setModelCustom] = useState("");
    const [customerApiKey, setCustomerApiKey] = useState("");
    const [name, setName] = useState("");

    // Edit: which key is being edited and form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editProvider, setEditProvider] = useState("");
    const [editProviderCustomName, setEditProviderCustomName] = useState("");
    const [editModel, setEditModel] = useState("");
    const [editModelCustom, setEditModelCustom] = useState("");
    const [editCustomerApiKey, setEditCustomerApiKey] = useState("");
    const [editName, setEditName] = useState("");
    const [editSubmitting, setEditSubmitting] = useState(false);

    // Delete: which key is pending delete (opens confirm dialog)
    const [keyToDeleteId, setKeyToDeleteId] = useState<string | null>(null);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);

    const fetchKeys = useCallback(async () => {
        try {
            const res = await fetch("/api/dashboard/api-keys");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setKeys(data.keys ?? []);
        } catch {
            toast.error("Failed to load connections");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchKeys();
    }, [fetchKeys]);

    const suggestedModels = provider && provider !== IS_OTHER ? MODELS_BY_PROVIDER[provider] : null;
    const CUSTOM_MODEL_VALUE = "__custom__";
    const isCustomModel = suggestedModels && model === CUSTOM_MODEL_VALUE;
    const modelToSend = suggestedModels
        ? (isCustomModel ? modelCustom.trim() : model)
        : (model.trim() || modelCustom.trim());

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!provider || !customerApiKey.trim()) {
            toast.error("Select a provider and enter your API key");
            return;
        }
        if (provider === IS_OTHER && !providerCustomName.trim()) {
            toast.error("Enter your provider name when using Other");
            return;
        }
        if (!modelToSend) {
            toast.error("Choose or enter a model. We send requests to this model on your behalf.");
            return;
        }
        setSubmitting(true);
        setNewKeyShown(null);
        try {
            const res = await fetch("/api/dashboard/api-keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider,
                    ...(provider === IS_OTHER && { providerCustomName: providerCustomName.trim() }),
                    model: modelToSend,
                    customerApiKey: customerApiKey.trim(),
                    name: name.trim() || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to connect");
            setNewKeyShown({
                gatewayKey: data.gatewayKey,
                provider: data.provider,
                providerName: data.providerName ?? data.provider,
                model: data.model ?? null,
            });
            setCustomerApiKey("");
            setProviderCustomName("");
            setModel("");
            setModelCustom("");
            setName("");
            await fetchKeys();
            toast.success("Connected. Copy your gateway key below — it won’t be shown again.");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to connect");
        } finally {
            setSubmitting(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const openEdit = useCallback(async (id: string) => {
        setEditingId(id);
        setEditCustomerApiKey("");
        try {
            const res = await fetch(`/api/dashboard/api-keys/${id}`);
            if (!res.ok) throw new Error("Failed to load");
            const k = await res.json();
            const isOther = !PROVIDER_IDS.includes(k.provider);
            setEditProvider(isOther ? IS_OTHER : k.provider);
            setEditProviderCustomName(isOther ? k.provider : "");
            const suggested = !isOther && k.provider ? MODELS_BY_PROVIDER[k.provider] : null;
            const modelInList = suggested?.some((m) => m.id === k.model);
            setEditModel(modelInList ? k.model : (suggested ? CUSTOM_MODEL_VALUE : ""));
            setEditModelCustom(modelInList ? "" : (k.model ?? ""));
            setEditName(k.name ?? "");
        } catch {
            toast.error("Failed to load connection");
            setEditingId(null);
        }
    }, []);

    const editSuggestedModels = editProvider && editProvider !== IS_OTHER ? MODELS_BY_PROVIDER[editProvider] : null;
    const editIsCustomModel = editSuggestedModels && editModel === CUSTOM_MODEL_VALUE;
    const editModelToSend = editSuggestedModels
        ? (editIsCustomModel ? editModelCustom.trim() : editModel)
        : (editModel.trim() || editModelCustom.trim());

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId) return;
        if (editProvider === IS_OTHER && !editProviderCustomName.trim()) {
            toast.error("Enter provider name when using Other");
            return;
        }
        if (!editModelToSend) {
            toast.error("Model is required");
            return;
        }
        setEditSubmitting(true);
        try {
            const res = await fetch(`/api/dashboard/api-keys/${editingId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: editProvider,
                    ...(editProvider === IS_OTHER && { providerCustomName: editProviderCustomName.trim() }),
                    model: editModelToSend,
                    ...(editCustomerApiKey.trim() && { customerApiKey: editCustomerApiKey.trim() }),
                    name: editName.trim() || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to update");
            await fetchKeys();
            setEditingId(null);
            toast.success("Connection updated");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to update");
        } finally {
            setEditSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!keyToDeleteId) return;
        setDeleteSubmitting(true);
        try {
            const res = await fetch(`/api/dashboard/api-keys/${keyToDeleteId}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error ?? "Failed to delete");
            }
            await fetchKeys();
            setKeyToDeleteId(null);
            toast.success("Connection removed");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to delete");
        } finally {
            setDeleteSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-semibold font-heading text-foreground">
                    Connect a provider
                </h1>
                <p className="text-muted-foreground mt-1">
                    Add your LLM provider API key; we give you a gateway key that wraps it and runs every request through our security layer.
                </p>
            </div>

            {/* How it works */}
            <Card className="bg-muted/20 border-primary/20">
                <CardHeader>
                    <CardTitle className="text-base">How it works</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>1. Choose a <strong className="text-foreground">provider</strong> and a <strong className="text-foreground">model</strong>, then enter your API key from that provider.</p>
                    <p>2. We generate a <strong className="text-foreground">gateway key</strong> for you. Use it in your app as <code className="px-1 py-0.5 rounded bg-muted">X-API-Key</code> when calling our gateway.</p>
                    <p>3. We receive the request, run security checks (jailbreak, PII, your policies), then send it to the chosen model using your key. One gateway key = one provider + model.</p>
                </CardContent>
            </Card>

            {/* Connect form */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Add provider & get gateway key</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Your API key is stored securely and only used to forward requests through our gateway.
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleConnect} className="space-y-4 max-w-lg">
                        <div className="space-y-2">
                            <Label htmlFor="provider">Provider</Label>
                            <Select value={provider || undefined} onValueChange={(v) => { setProvider(v); setModel(""); setModelCustom(""); }}>
                                <SelectTrigger id="provider" className="w-full">
                                    <SelectValue placeholder="Select provider" />
                                </SelectTrigger>
                                <SelectContent className="z-[100]" position="popper">
                                    {LLM_PROVIDERS.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name} — {p.description}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {provider === IS_OTHER && (
                            <div className="space-y-2">
                                <Label htmlFor="providerCustom">Provider name</Label>
                                <Input
                                    id="providerCustom"
                                    type="text"
                                    placeholder="e.g. Replicate, Fireworks, your vendor"
                                    value={providerCustomName}
                                    onChange={(e) => setProviderCustomName(e.target.value)}
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="model">Model (required)</Label>
                            {suggestedModels ? (
                                <>
                                    <Select value={model || undefined} onValueChange={setModel}>
                                        <SelectTrigger id="model" className="w-full">
                                            <SelectValue placeholder="Choose model" />
                                        </SelectTrigger>
                                        <SelectContent className="z-[100]" position="popper">
                                            {suggestedModels.map((m) => (
                                                <SelectItem key={m.id} value={m.id}>
                                                    {m.label}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value={CUSTOM_MODEL_VALUE}>Other (enter model ID)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {isCustomModel && (
                                        <Input
                                            placeholder="e.g. gpt-4o, claude-3-opus"
                                            value={modelCustom}
                                            onChange={(e) => setModelCustom(e.target.value)}
                                            className="mt-2"
                                        />
                                    )}
                                </>
                            ) : (
                                <Input
                                    id="model"
                                    type="text"
                                    placeholder="e.g. gpt-4o, claude-3-opus, gemini-pro"
                                    value={model || modelCustom}
                                    onChange={(e) => { setModel(e.target.value); setModelCustom(e.target.value); }}
                                    required
                                />
                            )}
                            <p className="text-xs text-muted-foreground">
                                We send requests to this model on your behalf and run security checks first.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="customerKey">Your API key (from the provider)</Label>
                            <Input
                                id="customerKey"
                                type="password"
                                placeholder="sk-... or your provider key"
                                value={customerApiKey}
                                onChange={(e) => setCustomerApiKey(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Label (optional)</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="e.g. Production"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? (
                                <Loader2Icon className="h-4 w-4 animate-spin" />
                            ) : (
                                "Connect & get gateway key"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* New key shown once */}
            {newKeyShown && (
                <Card className="border-primary/50 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="text-base">Your gateway key — copy it now</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Provider: {newKeyShown.providerName}
                            {newKeyShown.model && ` · Model: ${newKeyShown.model}`}. This is the only time we show the full key.
                        </p>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-center gap-2">
                        <code className="text-sm font-mono break-all flex-1 min-w-0">
                            {newKeyShown.gatewayKey}
                        </code>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(newKeyShown.gatewayKey)}
                        >
                            <CopyIcon className="h-4 w-4 mr-1" />
                            Copy
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* List of connections */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Your connections</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Gateway keys (masked). Use the gateway key in your app; we use your provider key to call the LLM.
                    </p>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                            <Loader2Icon className="h-8 w-8 animate-spin" />
                        </div>
                    ) : keys.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center py-12 text-center">
                            <KeyRoundIcon className="h-10 w-10 text-muted-foreground/50 mb-4" />
                            <p className="text-sm text-muted-foreground">No connections yet.</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Add a provider above to get your first gateway key.
                            </p>
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {keys.map((k) => (
                                <li
                                    key={k.id}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm"
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-medium text-foreground">{k.providerName}</span>
                                        {k.model && (
                                            <span className="text-xs text-muted-foreground font-mono">{k.model}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-muted-foreground">{k.gatewayKeyMasked}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(k.createdAt).toLocaleDateString()}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => openEdit(k.id)}
                                            aria-label="Edit"
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => setKeyToDeleteId(k.id)}
                                            aria-label="Delete"
                                        >
                                            <Trash2Icon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
