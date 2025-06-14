import { HTMLAttributes, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/authStore'
import { authAPI } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

const formSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: 'Please enter your name' })
      .min(2, { message: 'Name must be at least 2 characters' }),
    email: z
      .string()
      .min(1, { message: 'Please enter your email' })
      .email({ message: 'Invalid email address' }),
    password: z
      .string()
      .min(1, {
        message: 'Please enter your password',
      })
      .min(7, {
        message: 'Password must be at least 7 characters long',
      }),
    confirmPassword: z.string(),
    gender: z.enum(['Male', 'Female', 'Other'], {
      required_error: 'Please select a gender',
    }),
    jobPosition: z
      .string()
      .min(1, { message: 'Please enter your job position' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  })

export function SignUpForm({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { setUser, setAccessToken, setRefreshToken } = useAuthStore(
    (state) => state.auth
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      gender: 'Male',
      jobPosition: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      setError(null)

      console.log('SignUp payload:', data)

      const response = await authAPI.signUp({
        name: data.name,
        email: data.email,
        password: data.password,
        //role: 'unspecified', // ou 'collaborator', ou selon ce que tu souhaites par défaut
        gender: data.gender.toLowerCase(),
        jobPosition: data.jobPosition,
      })

      if (response.success) {
        // Save authentication data
        setAccessToken(response.token)
        setRefreshToken(response.refreshToken)
        setUser(response.user)

        // Show success message
        toast({
          title: 'Account created!',
          description: 'You have successfully signed up.',
          variant: 'default',
        })

        // Redirect to dashboard
        navigate({ to: '/' })
      } else {
        setError(response.message || 'Failed to create account')
      }
    } catch (err: any) {
      console.error('Sign-up error:', err)
      setError(
        err.response?.data?.message || 'An error occurred during sign up'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={cn('grid gap-6', className)}
      {...props}
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      {error && (
        <div className='rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400'>
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder='Enter your name' />
                </FormControl>
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
                  <Input {...field} placeholder='Enter your email' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='gender'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className='w-full rounded-md border bg-[#bee1e6] px-3 py-2 text-sm text-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary'
                  >
                    <option value='Male'>Male</option>
                    <option value='Female'>Female</option>
                    <option value='Other'>Other</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='jobPosition'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Position</FormLabel>
                <FormControl>
                  <Input {...field} placeholder='Enter your job position' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput {...field} placeholder='Enter your password' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='confirmPassword'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    {...field}
                    placeholder='Confirm your password'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='flex justify-center pb-6 pt-6'>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? 'Signing up...' : 'Sign Up'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
