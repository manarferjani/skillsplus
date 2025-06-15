import { HTMLAttributes, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { SignInResponse, User } from '@/interfaces/auth.interface'
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

type UserAuthFormProps = HTMLAttributes<HTMLDivElement>

const formSchema = z.object({
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
})

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Please enter your email')
    .email('Invalid email address'),
})

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forgotMode, setForgotMode] = useState(false) // Toggle forgot password mode
  const navigate = useNavigate()
  const { setUser, setAccessToken, setRefreshToken } = useAuthStore(
    (state) => state.auth
  )

  // Sign In form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Forgot Password form
  const forgotForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      setError(null)

      const response: SignInResponse = await authAPI.signIn(
        data.email,
        data.password
      )

      if (response.success) {
        localStorage.setItem('token', response.token)
        setAccessToken(response.token)
        setRefreshToken(response.refreshToken)
        setUser(response.user)

        // Redirect by role
        if (response.user.role === 'admin') {
          navigate({ to: '/dashboard-manager' })
        } else if (response.user.role === 'manager') {
          navigate({ to: '/dashboard-manager' })
        } else {
          navigate({ to: '/dashboard-manager' })
        }
      } else {
        setError(response.message || 'Failed to sign in')
      }
    } catch (err: any) {
      console.error('Sign-in error:', err)
      setError(
        err.response?.data?.message || 'An error occurred during sign in'
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function onForgotSubmit(data: z.infer<typeof forgotPasswordSchema>) {
    try {
      setIsLoading(true)
      setError(null)

      // Call API to send reset password email
      const res = await authAPI.forgotPassword(data.email) // À implémenter côté API client

      if (res.success) {
        toast({
          title: 'Reset email sent',
          description: 'Please check your email to reset your password.',
          variant: 'default', // ou "destructive" si c'est un message d'erreur
        })

        setForgotMode(false) // Retour au formulaire de connexion
      } else {
        setError(res.message || 'Failed to send reset email')
      }
    } catch (err: any) {
      console.error('Forgot password error:', err)
      setError(err.response?.data?.message || 'An error occurred')
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

      {forgotMode ? (
        // Forgot password form
        <Form {...forgotForm}>
          <form onSubmit={forgotForm.handleSubmit(onForgotSubmit)}>
            <FormField
              control={forgotForm.control}
              name='email'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel className='text-white'>Email</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Your email' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type='submit' disabled={isLoading} className='mt-6 w-full'>
              {isLoading ? 'Sending...' : 'Send Reset Email'}
            </Button>
            <Button
              variant='link'
              onClick={() => setForgotMode(false)}
              className='mt-4'
            >
              Back to Sign In
            </Button>
          </form>
        </Form>
      ) : (
        // Sign in form
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className='grid gap-2'>
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel className='text-white'>Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='Email' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel className='text-white'>Password</FormLabel>
                    <FormControl>
                      <PasswordInput {...field} placeholder='Password' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type='submit' disabled={isLoading} className='mt-6 w-full'>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className='mt-0 text-right'>
            <button
              type='button'
              className='text-blue-500 hover:underline'
              onClick={() => setForgotMode(true)}
            >
              Forgot Password?
            </button>
          </div>
        </Form>
      )}

      <div className='mt-6 text-center text-sm'>
        <p>
          Don't have an account?{' '}
          <Link to='/sign-up' className='text-blue-500 hover:underline'>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}
