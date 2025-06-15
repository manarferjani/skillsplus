import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { getUserById, updateUser } from '@/services/users.service'
import { Pencil, Trash2 } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import apiClient from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/authContext'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const profileFormSchema = z.object({
  username: z
    .string()
    .min(2, {
      message: 'Username must be at least 2 characters.',
    })
    .max(30, {
      message: 'Username must not be longer than 30 characters.',
    }),
  profileImage: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val.startsWith('http') || val.startsWith('/'), {
      message:
        'profileImage doit être une URL valide ou un chemin relatif commençant par /',
    }),

  email: z
    .string({
      required_error: 'Please select an email to display.',
    })
    .email(),
  bio: z.string().max(160).min(4),
  urls: z
    .array(
      z.object({
        value: z.string().url({ message: 'Please enter a valid URL.' }),
      })
    )
    .optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

// This can come from your database or API.
const defaultValues: Partial<ProfileFormValues> = {
  bio: 'I own a computer.',
  profileImage: null,
  urls: [
    { value: 'https://shadcn.com' },
    { value: 'http://twitter.com/shadcn' },
  ],
}

export default function ProfileForm() {
  const { user, setUser } = useAuth();
  const [loadingUser, setLoadingUser] = useState(true)
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: 'onChange',
  })
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const { fields, append } = useFieldArray({
    name: 'urls',
    control: form.control,
  })
  useEffect(() => {
    const fetchUser = async () => {
      if (user?.id) {
        try {
          const fullUser = await getUserById(user.id)

          form.reset({
            username: fullUser.username ?? '',
            email: fullUser.email ?? '',
            bio: fullUser.bio ?? '',
            urls:
              fullUser.urls?.map((u: { label: string; url: string }) => ({
                value: u.url,
              })) || [],
            profileImage: fullUser.profileImage ?? null, // <- ajoute ça
          })

          // 👇 Montre l'image actuelle en aperçu si aucune image sélectionnée
          if (fullUser.profileImage) {
            const isFullUrl = fullUser.profileImage.startsWith('http')
            const imageUrl = isFullUrl
              ? fullUser.profileImage
              : `http://localhost:5000${fullUser.profileImage}`

            setPreview(imageUrl)
          }
        } catch (error) {
          console.error(
            'Erreur lors du chargement du profil utilisateur',
            error
          )
        } finally {
          setLoadingUser(false)
        }
      }
    }

    fetchUser()
  }, [user?.id])

  const handleImageUpload = async () => {
    if (!file) return
    const formData = new FormData()
    formData.append('profileImage', file)

    try {
      const res = await apiClient.post('/api/upload/uploadI', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        //withCredentials: true, // si token est dans cookie
      })
      toast.success('Image uploaded!')
      return res.data.imageUrl // URL retournée par l'API
    } catch (error) {
      console.error('Upload failed', error)
      toast.error("Échec de l'envoi de l'image")
    }
  }

  async function onSubmit(data: ProfileFormValues) {
    try {
      let imageUrl
      if (file) {
        imageUrl = await handleImageUpload()
        if (imageUrl) {
          setPreview(imageUrl)
        }
      }

      const formattedUrls =
        data.urls?.map((urlObj) => ({
          label: 'Link',
          url: urlObj.value,
        })) || []

      const updated = await updateUser(user!.id, {
        username: data.username,
        email: data.email,
        bio: data.bio,
        urls: formattedUrls,
        ...(imageUrl && { profileImage: imageUrl }),
      })

      // Rafraîchir le contexte user après update
      const refreshedUser = await getUserById(user!.id)
      setUser(refreshedUser)

      toast.success('Profil mis à jour !')
    } catch (e) {
      console.error(e)
      toast.error('Échec de la mise à jour du profil')
    }
  }

  return (
    <>
      <Toaster />
      <div className='ml-5 rounded-lg bg-white p-6 shadow'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
            <div className='space-y-2'>
              <FormLabel>Profile Picture</FormLabel>

              {preview && (
                <div className='flex justify-center'>
                  <div className='relative h-32 w-32'>
                    <img
                      src={preview}
                      alt='Preview'
                      className='h-32 w-32 rounded-full border object-cover shadow'
                    />

                    {/* Conteneur pour les boutons */}
                    <div className='absolute bottom-0 right-0 flex gap-1'>
                      {/* Bouton Edit */}
                      <label className='cursor-pointer rounded-full bg-white p-1 shadow hover:bg-gray-100'>
                        <Pencil size={18} className='text-gray-600' />
                        <input
                          type='file'
                          accept='image/*'
                          onChange={(e) => {
                            const selectedFile = e.target.files?.[0]
                            if (selectedFile) {
                              setFile(selectedFile)
                              setPreview(URL.createObjectURL(selectedFile))
                            }
                          }}
                          className='hidden'
                        />
                      </label>

                      {/* Bouton Delete */}
                      <button
                        type='button'
                        onClick={() => {
                          setFile(null)
                          setPreview(null)
                          form.setValue('profileImage', null)
                        }}
                        className='rounded-full bg-white p-1 shadow hover:bg-red-100'
                      >
                        <Trash2 size={18} className='text-red-500' />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/*<Input
              type='file'
              accept='image/*'
              onChange={(e) => {
                const selectedFile = e.target.files?.[0]
                if (selectedFile) {
                  setFile(selectedFile)
                  setPreview(URL.createObjectURL(selectedFile))
                }
              }}
            />*/}
            </div>
            <FormField
              control={form.control}
              name='username'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder='skillBloom' {...field} />
                  </FormControl>
                  <FormDescription>
                    This is your public display name. It can be your real name
                    or a pseudonym. You can only change this once every 30 days.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder='your@email.com' {...field} />
                  </FormControl>
                  <FormDescription>
                    You can manage verified email addresses in your{' '}
                    <Link to='/'>email settings</Link>.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='bio'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Tell us a little bit about yourself'
                      className='resize-none'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    You can <span>@mention</span> other users and organizations
                    to link to them.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              {fields.map((field, index) => (
                <FormField
                  control={form.control}
                  key={field.id}
                  name={`urls.${index}.value`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(index !== 0 && 'sr-only')}>
                        URLs
                      </FormLabel>
                      <FormDescription className={cn(index !== 0 && 'sr-only')}>
                        Add links to your website, blog, or social media
                        profiles.
                      </FormDescription>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='mt-2 rounded-3xl'
                onClick={() => append({ value: '' })}
              >
                Add URL
              </Button>
            </div>
            <div className='flex justify-end'>
              <Button
                type='submit'
                className='rounded-3xl'
                style={{ backgroundColor: '#9d4edd' }}
              >
                Update profile
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  )
}
