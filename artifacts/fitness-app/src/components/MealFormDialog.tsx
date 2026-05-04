import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Meal } from "@workspace/api-client-react";
import { useTranslation } from "@/lib/language-context";
import { ImagePlus, X } from "lucide-react";

/**
 * MealFormDialog — one dialog, two modes.
 *
 * Serves both "Add Meal" and "Edit Meal" flows so all editable fields
 * (title, calories, mealType, protein, carbs, imageUrl) live in a single
 * place. Callers distinguish modes by passing `initialMeal`:
 *   - undefined → create mode
 *   - Meal      → edit mode (fields pre-fill, title says "Edit")
 *
 * The parent owns the mutation and open state; this component is
 * purely presentational + holds local form state. That keeps the
 * dialog reusable and avoids entangling it with React Query specifics.
 *
 * Image upload approach: we read the chosen file with `FileReader` and
 * persist the resulting data URL in the existing `imageUrl` text column.
 * That keeps the local-dev story trivial (no multipart route, no static
 * file serving, no migrations) at the cost of ~33% size inflation vs
 * binary. We cap files at 2 MB so the row stays sane.
 */

export type MealFormValues = {
  title: string;
  calories: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  /** Optional macros — `null` means the user cleared the field. */
  protein: number | null;
  carbs: number | null;
  /** Data URL or http(s) URL. `null` means no image / cleared. */
  imageUrl: string | null;
  /** Optional free-text description. `null` for no description. */
  description: string | null;
};

interface MealFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Undefined = create. Provided = edit. */
  initialMeal?: Meal;
  /** Parent handles the mutation. Return a promise so we can disable the
   *  submit button while in flight and close the dialog on success. */
  onSubmit: (values: MealFormValues) => Promise<void> | void;
  /** Reflects parent's mutation.isPending so the submit button can show loading. */
  isSubmitting?: boolean;
}

const MEAL_TYPES: MealFormValues["mealType"][] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
];

// Meal type values are the API enum. Labels come from the translations
// dictionary so the dropdown reflows when the user flips languages.
const MEAL_TYPE_LABEL_KEY: Record<MealFormValues["mealType"], string> = {
  breakfast: "nutrition.breakfast",
  lunch: "nutrition.lunch",
  dinner: "nutrition.dinner",
  snack: "nutrition.snack",
};

// Image upload constraints. Kept here (not in a shared constants file)
// because they're only meaningful inside this dialog.
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg"] as const;
const ACCEPTED_IMAGE_ATTR = ACCEPTED_IMAGE_TYPES.join(",");

/**
 * Parse an optional numeric form field. Returns `null` for empty / invalid
 * input so the server-side `imageUrl ?? null` pattern can clear the column.
 * Negative values are rejected upstream by the validation block.
 */
function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function MealFormDialog({
  open,
  onOpenChange,
  initialMeal,
  onSubmit,
  isSubmitting = false,
}: MealFormDialogProps) {
  const mode = initialMeal ? "edit" : "create";
  const { t } = useTranslation();

  // Local form state. We reset it whenever the dialog (re-)opens so
  // editing meal A, closing, then editing meal B shows B's values.
  const [title, setTitle] = useState("");
  const [calories, setCalories] = useState("");
  const [mealType, setMealType] = useState<MealFormValues["mealType"]>("breakfast");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Hidden file input pattern: a styled Button triggers the click so we
  // get dark-theme styling instead of the browser's default file input.
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(initialMeal?.title ?? "");
    setCalories(initialMeal?.calories != null ? String(initialMeal.calories) : "");
    // Narrow the wider API union down to our local mealType type. The
    // server already constrains this to the same four values.
    setMealType((initialMeal?.mealType as MealFormValues["mealType"]) ?? "breakfast");
    setProtein(initialMeal?.protein != null ? String(initialMeal.protein) : "");
    setCarbs(initialMeal?.carbs != null ? String(initialMeal.carbs) : "");
    setImageUrl(initialMeal?.imageUrl ?? null);
    setDescription(initialMeal?.description ?? "");
    setError(null);
    // Clear the native file input so re-opening doesn't show a stale
    // filename label (some browsers keep it across .value resets).
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open, initialMeal]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
      setError(t("mealForm.errorImageType"));
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(t("mealForm.errorImageTooLarge"));
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      // Result is a data URL ("data:image/png;base64,...") — safe to
      // store as-is in the existing imageUrl text column and to render
      // directly in <img src=...>. No URL.createObjectURL leak risk.
      const result = reader.result;
      if (typeof result === "string") {
        setImageUrl(result);
        setError(null);
      }
    };
    reader.onerror = () => {
      setError(t("mealForm.errorImageType"));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const parsedCalories = Number(calories);
    const parsedProtein = parseOptionalNumber(protein);
    const parsedCarbs = parseOptionalNumber(carbs);

    if (!trimmedTitle) {
      setError(t("mealForm.errorTitleRequired"));
      return;
    }
    if (!Number.isFinite(parsedCalories) || parsedCalories < 0) {
      setError(t("mealForm.errorCaloriesInvalid"));
      return;
    }
    // Macros are optional. If the user typed something, it has to be a
    // non-negative finite number; an empty field is fine and means NULL.
    if (protein.trim() !== "" && (parsedProtein === null || parsedProtein < 0)) {
      setError(t("mealForm.errorProteinInvalid"));
      return;
    }
    if (carbs.trim() !== "" && (parsedCarbs === null || parsedCarbs < 0)) {
      setError(t("mealForm.errorCarbsInvalid"));
      return;
    }

    setError(null);
    // Description is optional. Trim and convert empty to null so the
    // API doesn't store whitespace-only strings.
    const trimmedDescription = description.trim();
    await onSubmit({
      title: trimmedTitle,
      calories: Math.round(parsedCalories),
      mealType,
      protein: parsedProtein,
      carbs: parsedCarbs,
      imageUrl,
      description: trimmedDescription === "" ? null : trimmedDescription,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Dark-theme card styling matches the rest of the app. The form
          can grow tall now that it has macros + image preview, so we
          allow the dialog to scroll its body on small screens. */}
      <DialogContent className="bg-card border-border text-foreground dark:border-white/10 dark:text-white sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">
            {mode === "edit" ? t("mealForm.editMealTitle") : t("mealForm.addMealTitle")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {mode === "edit"
              ? t("mealForm.editMealDesc")
              : t("mealForm.addMealDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meal-title" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {t("mealForm.titleLabel")}
            </Label>
            <Input
              id="meal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("mealForm.titlePlaceholder")}
              className="bg-background border-border dark:border-white/10 h-11 rounded-xl"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meal-calories" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {t("mealForm.caloriesLabel")}
            </Label>
            <Input
              id="meal-calories"
              type="number"
              min={0}
              inputMode="numeric"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder={t("mealForm.caloriesPlaceholder")}
              className="bg-background border-border dark:border-white/10 h-11 rounded-xl"
            />
          </div>

          {/* Macros side-by-side — keeps the form compact and groups the
              two fields that semantically belong together. */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="meal-protein" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {t("mealForm.proteinLabel")}
              </Label>
              <Input
                id="meal-protein"
                type="number"
                min={0}
                step="0.1"
                inputMode="decimal"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder={t("mealForm.proteinPlaceholder")}
                className="bg-background border-border dark:border-white/10 h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meal-carbs" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {t("mealForm.carbsLabel")}
              </Label>
              <Input
                id="meal-carbs"
                type="number"
                min={0}
                step="0.1"
                inputMode="decimal"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder={t("mealForm.carbsPlaceholder")}
                className="bg-background border-border dark:border-white/10 h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {t("mealForm.mealTypeLabel")}
            </Label>
            <Select value={mealType} onValueChange={(v) => setMealType(v as MealFormValues["mealType"])}>
              <SelectTrigger className="bg-background border-border dark:border-white/10 h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground dark:border-white/10 dark:text-white">
                {MEAL_TYPES.map((type) => (
                  <SelectItem key={type} value={type} className="capitalize">
                    {t(MEAL_TYPE_LABEL_KEY[type])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Optional free-text description. Renders on the meal card
              below the macros, so a one-line note (e.g. "leftovers
              from Sunday") is enough — but the textarea allows a few
              lines for users who want richer context. */}
          <div className="space-y-2">
            <Label
              htmlFor="meal-description"
              className="text-sm font-bold uppercase tracking-wider text-muted-foreground"
            >
              {t("mealForm.descriptionLabel")}
            </Label>
            <Textarea
              id="meal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("mealForm.descriptionPlaceholder")}
              className="bg-background border-border dark:border-white/10 rounded-xl min-h-[80px] resize-y"
            />
          </div>

          {/* Image upload — hidden native input + styled trigger button so
              the control matches the dark theme. The preview reuses the
              same rounded card framing used elsewhere in the app. */}
          <div className="space-y-2">
            <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {t("mealForm.imageLabel")}
            </Label>

            {imageUrl && (
              <div className="relative rounded-xl overflow-hidden border border-border dark:border-white/10 bg-background">
                <img
                  src={imageUrl}
                  alt={t("mealForm.imagePreviewAlt")}
                  className="w-full h-40 object-cover"
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_IMAGE_ATTR}
                className="hidden"
                onChange={handleFileChange}
                aria-hidden="true"
                tabIndex={-1}
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-border dark:border-white/10 hover:bg-background"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                {imageUrl
                  ? t("mealForm.changeImage")
                  : t("mealForm.chooseImage")}
              </Button>
              {imageUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-background"
                  onClick={handleRemoveImage}
                >
                  <X className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                  {t("mealForm.removeImage")}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("mealForm.imageHelp")}
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl hover:bg-background"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 neon-glow font-bold"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t("common.saving")
                : mode === "edit"
                ? t("mealForm.saveChanges")
                : t("mealForm.addMealButton")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default MealFormDialog;
