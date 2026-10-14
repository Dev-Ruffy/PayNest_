"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Plus, Pencil, Package } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { HelpGuide } from "@/components/ui/HelpGuide";
import { api, extractErrorMessage } from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types";
import { createProductSchema, CreateProductInput } from "@/lib/validation";

export function ProductsTab() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["seller-products"],
    queryFn: async () => (await api.get("/seller/products")).data.data as Product[],
  });

  const createForm = useForm<CreateProductInput>({ resolver: zodResolver(createProductSchema) });
  const editForm = useForm<CreateProductInput>({ resolver: zodResolver(createProductSchema) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["seller-products"] });

  const createMutation = useMutation({
    mutationFn: (data: CreateProductInput) => api.post("/seller/products", data),
    onSuccess: () => {
      toast.success("Product added.");
      setCreateOpen(false);
      createForm.reset();
      invalidate();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateProductInput) => api.put(`/seller/products/${editTarget!.id}`, data),
    onSuccess: () => {
      toast.success("Product updated.");
      setEditTarget(null);
      invalidate();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (product: Product) => api.put(`/seller/products/${product.id}`, { isActive: !product.isActive }),
    onSuccess: () => {
      toast.success("Product updated.");
      invalidate();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>Products &amp; prices</CardTitle>
            <HelpGuide title="Adding products and prices">
              <p>
                This is your tuck shop&apos;s price list. Every product you add here shows up automatically for
                Housemasters when they build a bulk order, so students&apos; totals are calculated for them instead
                of anyone doing the math by hand.
              </p>
              <ol>
                <li>Click <strong>Add product</strong> and give it a name and a price.</li>
                <li>It appears immediately in the Housemaster&apos;s product picker.</li>
                <li>
                  If you stop selling something, use <strong>Deactivate</strong> instead of deleting it. Past orders
                  that used it stay intact, and it just disappears from new pickers.
                </li>
                <li>Editing a price only affects new orders. Anything already placed keeps its original price.</li>
              </ol>
            </HelpGuide>
          </div>
          <CardDescription>Every active product here appears in Housemasters&apos; bulk order builder.</CardDescription>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Add product
        </Button>
      </CardHeader>
      <CardContent>
        <Table
          isLoading={isLoading}
          data={products ?? []}
          keyExtractor={(row) => row.id}
          emptyLabel="No products yet. Add your first one to get started."
          columns={[
            {
              header: "Product",
              accessor: (p) => (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                    <Package className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{p.name}</span>
                </div>
              ),
            },
            { header: "Price", accessor: (p) => <span className="font-mono">{formatCurrency(p.price)}</span> },
            { header: "Status", accessor: (p) => <Badge tone={p.isActive ? "emerald" : "slate"}>{p.isActive ? "Active" : "Inactive"}</Badge> },
            {
              header: "",
              accessor: (p) => (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setEditTarget(p);
                      editForm.reset({ name: p.name, price: Number(p.price) });
                    }}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:border-brass hover:text-ink transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => toggleActiveMutation.mutate(p)}
                    disabled={toggleActiveMutation.isPending}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:border-brick hover:text-brick transition-colors disabled:opacity-50"
                  >
                    {p.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              ),
            },
          ]}
        />
      </CardContent>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add a product">
        <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-3">
          <div>
            <Label>Product name</Label>
            <Input placeholder="Meat pie" {...createForm.register("name")} error={createForm.formState.errors.name?.message} />
          </div>
          <div>
            <Label>Price</Label>
            <Input type="number" step="0.01" placeholder="700" {...createForm.register("price")} error={createForm.formState.errors.price?.message} />
          </div>
          <Button type="submit" className="w-full" isLoading={createMutation.isPending}>Add product</Button>
        </form>
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title={`Edit ${editTarget?.name}`}>
        <form onSubmit={editForm.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-3">
          <div>
            <Label>Product name</Label>
            <Input {...editForm.register("name")} error={editForm.formState.errors.name?.message} />
          </div>
          <div>
            <Label>Price</Label>
            <Input type="number" step="0.01" {...editForm.register("price")} error={editForm.formState.errors.price?.message} />
          </div>
          <Button type="submit" className="w-full" isLoading={updateMutation.isPending}>Save changes</Button>
        </form>
      </Modal>
    </Card>
  );
}
