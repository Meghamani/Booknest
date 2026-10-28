"use client";

import { useForm, Controller } from "react-hook-form";
import { BookFormValues } from "@/types/books";
import ImageUploader from "@/components/books/ImageUploader";
import { theme } from "@/constants/theme";
import { GENRES } from "@/constants/genres";

interface BookFormPageProps {
  initialData?: Partial<BookFormValues>;
  defaultStatus: "library" | "finished" | "wishlist";
  formTitle?: string;
  onSave: (data: BookFormValues) => void;
  onClose: () => void;
}

export default function BookFormPage({
  initialData,
  defaultStatus,
  formTitle,
  onSave,
  onClose,
}: BookFormPageProps) {
  const isPartialForm = defaultStatus === "library" || defaultStatus === "wishlist";

  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<BookFormValues>({
    defaultValues: {
      title: initialData?.title || "",
      author: initialData?.author || "",
      genre: initialData?.genre || "",
      status: initialData?.status || defaultStatus,
      rating: initialData?.rating || 0,
      imageUrl: initialData?.imageUrl || "",
      review: initialData?.review || "",
      notes: initialData?.notes || "",
    },
  });

  const watchedRating = watch("rating");

  const onSubmit = (data: BookFormValues) => {
    onSave(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full overflow-hidden bg-card text-textPrimary flex flex-col md:flex-row"
    >
      <div className="flex h-[45%] items-start justify-center p-6 md:w-1/3" style={{ background: theme.colors.accent }}>
        <Controller
          name="imageUrl"
          control={control}
          render={({ field }) => (
            <ImageUploader
              value={field.value || ""}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      {/* Right Column - Fields */}
      <div className="md:w-2/3 p-6 flex flex-col gap-4">
        <h2 className="text-2xl font-semibold mb-4 text-center md:text-left">{formTitle || (defaultStatus === "finished" ? "Complete Your Reading" : "Add New Book")}</h2>

        {/* Title & Author */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block font-medium">Title <span className="text-coral">*</span></label>
            <input
              {...register("title", { required: true })}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accentHover"
            />
            {errors.title && <span className="text-coral text-sm">Title is Required</span>}
          </div>
          <div>
            <label className="mb-1 block font-medium">Author <span className="text-coral">*</span></label>
            <input
              {...register("author", { required: true })}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accentHover"
            />
            {errors.author && <span className="text-coral text-sm">Author is Required</span>}
          </div>
        </div>

        {/* Genre & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block font-medium">Genre <span className="text-coral">*</span></label>
            <input
              list="book-genres"
              {...register("genre", { required: true })}
              placeholder="Choose or enter a genre"
              className="w-full rounded-lg border border-border bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accentHover"
            />
            <datalist id="book-genres">
              {GENRES.map((genre) => <option key={genre} value={genre} />)}
            </datalist>
            {errors.genre && <span className="text-coral text-sm">Genre is Required</span>}
          </div>

        </div>

        {!isPartialForm && (
          <>
            {/* Rating */}
            <div>
              <label className="block font-medium mb-1">Rating</label>
              <div className="flex space-x-2 text-2xl">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    onClick={() => setValue("rating", i)}
                    className={`cursor-pointer ${i <= watchedRating ? "text-secondaryAccent" : "text-border"}`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            {/* Review & Notes */}
            <div>
              <label className="block font-medium mb-1">Review</label>
              <textarea
                {...register("review")}
                rows={3}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accentHover"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Quotes / Thoughts</label>
              <textarea
                {...register("notes")}
                rows={3}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accentHover"
              />
            </div>
          </>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            type="submit"
            className="rounded-lg px-6 py-2 font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: theme.colors.sidebarBg }}
          >
            Save
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-6 py-2 font-semibold text-textPrimary transition hover:opacity-90"
            style={{ backgroundColor: theme.colors.secondaryAccent }}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
