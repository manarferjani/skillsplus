import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { useFont } from '@/context/font-context';
import { useTheme } from '@/context/theme-context';
import { toast } from '@/hooks/use-toast';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useEffect, useState } from 'react';

// Définir le type Theme (ajustez selon votre contexte theme-context)
type Theme = 'light' | 'dark'; // Étendez si nécessaire, ex: 'light' | 'dark' | 'blue'

// Configuration par défaut pour les thèmes
const defaultThemes: { value: Theme; label: string; preview: { bg: string; cardBg: string; accent: string } }[] = [
  {
    value: 'light',
    label: 'Light',
    preview: { bg: '#ecedef', cardBg: 'white', accent: '#ecedef' },
  },
  {
    value: 'dark',
    label: 'Dark',
    preview: { bg: 'slate-950', cardBg: 'slate-800', accent: 'slate-400' },
  },
];

// Configuration par défaut pour les polices
const defaultFonts = ['inter', 'manrope', 'roboto'];

// Interface pour les props
interface AppearanceFormProps {
  configSource?: string;
  initialThemes?: typeof defaultThemes;
  initialFonts?: string[];
}

// Schéma Zod dynamique
const createAppearanceFormSchema = (fonts: string[], themes: Theme[]) => {
  if (themes.length === 0) {
    throw new Error("Le tableau des thèmes ne peut pas être vide.");
  }
  if (fonts.length === 0) {
    throw new Error("Le tableau des polices ne peut pas être vide.");
  }

  return z.object({
    theme: z.enum(themes as [Theme, ...Theme[]], {
      required_error: 'Veuillez sélectionner un thème.',
    }),
    font: z.enum(fonts as [string, ...string[]], {
      invalid_type_error: 'Sélectionnez une police.',
      required_error: 'Veuillez sélectionner une police.',
    }),
  });
};


type AppearanceFormValues = z.infer<ReturnType<typeof createAppearanceFormSchema>>;

export function AppearanceForm({
  configSource,
  initialThemes = defaultThemes,
  initialFonts = defaultFonts,
}: AppearanceFormProps) {
  const { font, setFont } = useFont();
  const { theme, setTheme } = useTheme();
  const [themes, setThemes] = useState(initialThemes);
  const [fonts, setFonts] = useState(initialFonts);
  const [isLoading, setIsLoading] = useState(false);

  // Initialisation du formulaire
  const form = useForm<AppearanceFormValues>({
    resolver: zodResolver(createAppearanceFormSchema(fonts, themes.map((t) => t.value))),
    defaultValues: {
      theme: theme as AppearanceFormValues['theme'],
      font,
    },
  });

  // Charger les configurations dynamiquement si une source est fournie
  useEffect(() => {
    if (configSource) {
      setIsLoading(true);
      fetch(configSource)
        .then((res) => {
          if (!res.ok) throw new Error('Échec de la récupération des configurations');
          return res.json();
        })
        .then((data) => {
          // Valider que les thèmes reçus sont conformes au type Theme
          const validatedThemes = data.themes?.filter((t: any) => themes.includes(t.value)) || initialThemes;
          setThemes(validatedThemes);
          setFonts(data.fonts || initialFonts);
        })
        .catch((error) => {
          console.error('Erreur:', error);
          toast({
            title: 'Erreur',
            description: 'Impossible de charger les configurations.',
            variant: 'destructive',
          });
        })
        .finally(() => setIsLoading(false));
    }
  }, [configSource, initialThemes, initialFonts]);

  // Charger les préférences utilisateur
  useEffect(() => {
    fetch('/api/user/preferences', { headers: { 'user-id': 'user123' } })
      .then((res) => {
        if (!res.ok) throw new Error('Échec de la récupération des préférences');
        return res.json();
      })
      .then((data) => {
        // Valider que les données reçues sont conformes au type Theme
        const validatedTheme = themes.find((t) => t.value === data.theme)
          ? data.theme
          : themes[0]?.value || 'light';
        form.reset({ theme: validatedTheme as Theme, font: data.font || fonts[0] });
      })
      .catch((error) => {
        console.error('Erreur:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les préférences utilisateur.',
          variant: 'destructive',
        });
      });
  }, [form, themes, fonts]);

  // Gestion de la soumission
  function onSubmit(data: AppearanceFormValues) {
  fetch('/api/user/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'user-id': 'user123' },
    body: JSON.stringify(data),
  })
    .then((res) => {
      if (!res.ok) throw new Error('Échec de la sauvegarde des préférences');
      return res.json();
    })
    .then(() => {
      // Assert that data.font is of the expected font type
      if (data.font !== font) setFont(data.font as 'inter' | 'manrope' | 'system');
      if (data.theme !== theme) setTheme(data.theme);
      toast({
        title: 'Préférences mises à jour',
        description: (
          <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
            <code className="text-white">{JSON.stringify(data, null, 2)}</code>
          </pre>
        ),
      });
    })
    .catch((error) => {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les préférences.',
        variant: 'destructive',
      });
    });
}

  if (isLoading) {
    return <div>Chargement des configurations...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="font"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Police</FormLabel>
              <div className="relative w-max">
                <FormControl>
                  <select
                    className={cn(
                      buttonVariants({ variant: 'outline' }),
                      'w-[200px] appearance-none font-normal capitalize'
                    )}
                    {...field}
                  >
                    {fonts.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <ChevronDownIcon className="absolute right-3 top-2.5 h-4 w-4 opacity-50" />
              </div>
              <FormDescription className="font-manrope">
                Définissez la police que vous souhaitez utiliser dans le tableau de bord.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>Thème</FormLabel>
              <FormDescription>Sélectionnez le thème pour le tableau de bord.</FormDescription>
              <FormMessage />
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="grid max-w-md grid-cols-2 gap-8 pt-2"
              >
                {themes.map((theme) => (
                  <FormItem key={theme.value}>
                    <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                      <FormControl>
                        <RadioGroupItem value={theme.value} className="sr-only" />
                      </FormControl>
                      <div
                        className={cn(
                          'items-center rounded-md border-2 border-muted p-1',
                          'hover:border-accent',
                          theme.value === 'dark' && 'bg-popover hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <div className={cn('space-y-2 rounded-sm p-2', `bg-[${theme.preview.bg}]`)}>
                          <div className={cn('space-y-2 rounded-md p-2 shadow-sm', `bg-[${theme.preview.cardBg}]`)}>
                            <div className={cn('h-2 w-[80px] rounded-lg', `bg-[${theme.preview.accent}]`)} />
                            <div className={cn('h-2 w-[100px] rounded-lg', `bg-[${theme.preview.accent}]`)} />
                          </div>
                          <div className={cn('flex items-center space-x-2 rounded-md p-2 shadow-sm', `bg-[${theme.preview.cardBg}]`)}>
                            <div className={cn('h-4 w-4 rounded-full', `bg-[${theme.preview.accent}]`)} />
                            <div className={cn('h-2 w-[100px] rounded-lg', `bg-[${theme.preview.accent}]`)} />
                          </div>
                          <div className={cn('flex items-center space-x-2 rounded-md p-2 shadow-sm', `bg-[${theme.preview.cardBg}]`)}>
                            <div className={cn('h-4 w-4 rounded-full', `bg-[${theme.preview.accent}]`)} />
                            <div className={cn('h-2 w-[100px] rounded-lg', `bg-[${theme.preview.accent}]`)} />
                          </div>
                        </div>
                      </div>
                      <span className="block w-full p-2 text-center font-normal">
                        {theme.label}
                      </span>
                    </FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
            </FormItem>
          )}
        />
        <Button type="submit">Mettre à jour les préférences</Button>
      </form>
    </Form>
  );
}