import { HTMLAttributes, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { SignInResponse, User } from '@/interfaces/auth.interface'
import { cn } from '@/lib/utils'
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
import { authAPI } from '@/lib/api-client'
import { useAuthStore } from '@/stores/authStore'
import { toast } from '@/hooks/use-toast'

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

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { setUser, setAccessToken, setRefreshToken } = useAuthStore((state) => state.auth)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      setError(null)

      const response: SignInResponse = await authAPI.signIn(data.email, data.password)

      if (response.success) {
        console.log(response.token);
        localStorage.setItem('token',response.token)
        // setAccessToken(response.token)
        setRefreshToken(response.refreshToken)
        setUser(response.user) // L'utilisateur est maintenant typé comme un objet `User`

        // Rediriger en fonction du rôle
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
      setError(err.response?.data?.message || 'An error occurred during sign in')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('grid gap-6', className)} {...props} style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>Email</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>Password</FormLabel>
                <FormControl>
                  <PasswordInput {...field} placeholder="Password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full mt-6">
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-sm text-center">
        <p>
          Don't have an account?{' '}
          <Link to="/sign-up" className="text-blue-500 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}
