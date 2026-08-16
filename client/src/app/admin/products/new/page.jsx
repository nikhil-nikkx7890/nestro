"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import ProductForm from "../components/ProductForm";
import { productService } from "@/services/product.service";

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (formData) => {
    try {
      setIsSubmitting(true);
      const response = await productService.create(formData);
      toast.success("Product created. Now add its first variant.");

      // Option B flow: Product and Variant are separate concerns, so we
      // create the Product first, then send the user straight into the
      // Variant page for it rather than nesting a variant editor in
      // this form. `firstVariant=true` lets that page show a more
      // prominent "add your first variant" prompt.
      router.push(`/admin/products/${response.data._id}/variants?firstVariant=true`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">New Product</h1>
        <p className="mt-2 text-neutral-500">
          Add the product details, then create its first variant.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <ProductForm onSubmit={handleCreate} onCancel={() => router.push("/admin/products")} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
