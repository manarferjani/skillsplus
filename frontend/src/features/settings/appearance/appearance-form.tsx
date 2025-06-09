"use client"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { cn } from "@/lib/utils"
import { useFont } from "@/context/font-context"
import { useTheme } from "@/context/theme-context"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { Check, Loader2, Palette, Type, Sparkles, Moon, Sun } from "lucide-react"

// Define Theme type
type Theme = "light" | "dark"
type FontType = "inter" | "manrope" | "system"

// Default configurations with enhanced previews
const defaultThemes = [
  {
    value: "light" as Theme,
    label: "Light",
    icon: Sun,
    preview: {
      bg: "bg-gradient-to-br from-slate-50 to-blue-50",
      cardBg: "bg-white/80 backdrop-blur-sm",
      accent: "bg-gradient-to-r from-blue-100 to-purple-100",
      border: "border-slate-200/50",
    },
  },
  {
    value: "dark" as Theme,
    label: "Dark",
    icon: Moon,
    preview: {
      bg: "bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950",
      cardBg: "bg-slate-800/80 backdrop-blur-sm",
      accent: "bg-gradient-to-r from-purple-500/20 to-blue-500/20",
      border: "border-slate-700/50",
    },
  },
]

const defaultFonts: FontType[] = ["inter", "manrope", "system"]

const fontDisplayNames = {
  inter: "Inter",
  manrope: "Manrope",
  system: "System",
}

// Interface for props
interface AppearanceFormProps {
  configSource?: string
  initialThemes?: typeof defaultThemes
  initialFonts?: FontType[]
}

// Dynamic Zod schema
const createAppearanceFormSchema = (fonts: FontType[], themes: Theme[]) => {
  if (themes.length === 0) {
    throw new Error("Theme array cannot be empty.")
  }
  if (fonts.length === 0) {
    throw new Error("Font array cannot be empty.")
  }

  return z.object({
    theme: z.enum(themes as [Theme, ...Theme[]], {
      required_error: "Please select a theme.",
    }),
    font: z.enum(fonts as [FontType, ...FontType[]], {
      invalid_type_error: "Select a font.",
      required_error: "Please select a font.",
    }),
  })
}

type AppearanceFormValues = z.infer<ReturnType<typeof createAppearanceFormSchema>>

export function AppearanceForm({
  configSource,
  initialThemes = defaultThemes,
  initialFonts = defaultFonts,
}: AppearanceFormProps) {
  const { font, setFont } = useFont()
  const { theme, setTheme } = useTheme()
  const [themes, setThemes] = useState(initialThemes)
  const [fonts, setFonts] = useState(initialFonts)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Initialize form
  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(
      createAppearanceFormSchema(
        fonts,
        themes.map((t) => t.value),
      ),
    ),
    defaultValues: {
      theme: theme as Theme,
      font: font as FontType,
    },
  })

  // Load configurations dynamically if a source is provided
  useEffect(() => {
    if (configSource) {
      setIsLoading(true)
      fetch(configSource)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to retrieve configurations")
          return res.json()
        })
        .then((data) => {
          // Validate that received themes conform to the Theme type
          const validatedThemes =
            data.themes?.filter((t: any) => defaultThemes.some((dt) => dt.value === t.value)) || initialThemes

          setThemes(validatedThemes)

          // Validate fonts
          const validatedFonts = data.fonts?.filter((f: any) => defaultFonts.includes(f)) || initialFonts

          setFonts(validatedFonts)
        })
        .catch((error) => {
          console.error("Error:", error)
          toast({
            title: "Error",
            description: "Unable to load configurations.",
            variant: "destructive",
          })
        })
        .finally(() => setIsLoading(false))
    }
  }, [configSource, initialThemes, initialFonts])

  // Load user preferences
  useEffect(() => {
    fetch("/api/user/preferences", { headers: { "user-id": "user123" } })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to retrieve preferences")
        return res.json()
      })
      .then((data) => {
        // Validate that received data conforms to the Theme type
        const validatedTheme = themes.find((t) => t.value === data.theme) ? data.theme : themes[0]?.value || "light"

        const validatedFont = fonts.includes(data.font as FontType) ? data.font : fonts[0]

        form.reset({
          theme: validatedTheme as Theme,
          font: validatedFont as FontType,
        })
      })
      .catch((error) => {
        console.error("Error:", error)
        toast({
          title: "Error",
          description: "Unable to load user preferences.",
          variant: "destructive",
        })
      })
  }, [form, themes, fonts])

  // Handle submission
  function onSubmit(data: AppearanceFormValues) {
    setIsSaving(true)
    fetch("/api/user/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json", "user-id": "user123" },
      body: JSON.stringify(data),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to save preferences")
        return res.json()
      })
      .then(() => {
        // Update context values
        if (data.font !== font) setFont(data.font)
        if (data.theme !== theme) setTheme(data.theme)

        toast({
          title: "Preferences updated",
          description: "Your appearance settings have been saved successfully.",
        })
      })
      .catch((error) => {
        console.error("Error:", error)
        toast({
          title: "Error",
          description: "Unable to save preferences.",
          variant: "destructive",
        })
      })
      .finally(() => setIsSaving(false))
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <Sparkles className="h-6 w-6 text-primary/60 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">Loading configurations...</p>
          <p className="text-sm text-muted-foreground">Preparing your personalization options</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header Section */}
  

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
          {/* Font Selection */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
                <Type className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Typography</h3>
                <p className="text-sm text-muted-foreground">Choose your preferred font family</p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="font"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full max-w-xs h-12 border-2 hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="Select a font" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fonts.map((font) => (
                        <SelectItem key={font} value={font} className="py-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <Type className="h-4 w-4 text-gray-600" />
                            </div>
                            <span className="font-medium">{fontDisplayNames[font]}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Theme Selection */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
                <Palette className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Theme</h3>
                <p className="text-sm text-muted-foreground">Select your preferred color scheme</p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem className="space-y-6">
                  <FormMessage />
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    {themes.map((theme) => {
                      const IconComponent = theme.icon
                      const isSelected = field.value === theme.value

                      return (
                        <FormItem key={theme.value} className="relative">
                          <FormLabel className="cursor-pointer">
                            <FormControl>
                              <RadioGroupItem value={theme.value} className="sr-only" />
                            </FormControl>
                            <div
                              className={cn(
                                "group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
                                isSelected
                                  ? "border-primary shadow-lg ring-4 ring-primary/20"
                                  : "border-border hover:border-primary/50",
                              )}
                            >
                              {/* Theme Preview */}
                              <div className={cn("p-6 transition-all duration-300", theme.preview.bg)}>
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center space-x-3">
                                    <div
                                      className={cn(
                                        "flex items-center justify-center w-8 h-8 rounded-lg",
                                        isSelected ? "bg-primary text-primary-foreground" : theme.preview.accent,
                                      )}
                                    >
                                      <IconComponent className="h-4 w-4" />
                                    </div>
                                    <span className="font-semibold text-lg">{theme.label}</span>
                                  </div>

                                  {/* Selection Indicator */}
                                  <div
                                    className={cn(
                                      "flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-200",
                                      isSelected
                                        ? "bg-primary border-primary"
                                        : "border-muted-foreground/30 group-hover:border-primary/50",
                                    )}
                                  >
                                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                  </div>
                                </div>

                                {/* Preview Cards */}
                                <div className="space-y-3">
                                  <div
                                    className={cn(
                                      "rounded-xl p-4 border transition-all duration-200",
                                      theme.preview.cardBg,
                                      theme.preview.border,
                                    )}
                                  >
                                    <div className="flex items-center space-x-3 mb-3">
                                      <div className={cn("h-3 w-3 rounded-full", theme.preview.accent)} />
                                      <div className={cn("h-2 w-24 rounded-full", theme.preview.accent)} />
                                    </div>
                                    <div className={cn("h-2 w-32 rounded-full", theme.preview.accent)} />
                                  </div>

                                  <div
                                    className={cn(
                                      "rounded-xl p-4 border transition-all duration-200",
                                      theme.preview.cardBg,
                                      theme.preview.border,
                                    )}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className={cn("h-4 w-4 rounded-full", theme.preview.accent)} />
                                      <div className={cn("h-2 w-28 rounded-full", theme.preview.accent)} />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Hover Effect */}
                              <div
                                className={cn(
                                  "absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 transition-opacity duration-300",
                                  "group-hover:opacity-100",
                                )}
                              />
                            </div>
                          </FormLabel>
                        </FormItem>
                      )
                    })}
                  </RadioGroup>
                </FormItem>
              )}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <Button
              type="submit"
              size="lg"
              className={cn(
                "min-w-[200px] h-12 rounded-xl font-semibold transition-all duration-300",
                "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700",
                "shadow-lg hover:shadow-xl hover:scale-[1.02]",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
              )}
              disabled={isLoading || isSaving}
            >
              {isSaving ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Save Preferences</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
