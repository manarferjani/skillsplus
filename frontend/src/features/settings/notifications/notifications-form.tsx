"use client"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useState, useEffect } from "react"
import {
  Bell,
  BellOff,
  Mail,
  Shield,
  CheckCircle2,
  Loader2,
} from "lucide-react"

const notificationsFormSchema = z.object({
  type: z.enum(["all", "none"], {
    required_error: "You need to select a notification type.",
  }),
  mobile: z.boolean().default(false).optional(),
  communication_emails: z.boolean().default(false).optional(),
  social_emails: z.boolean().default(false).optional(),
  marketing_emails: z.boolean().default(false).optional(),
  security_emails: z.boolean(),
})

type NotificationsFormValues = z.infer<typeof notificationsFormSchema>

export default function NotificationsForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      type: "none",
      mobile: false,
      communication_emails: false,
      security_emails: true,
    },
  })

  // Fetch initial form data
  useEffect(() => {
    const fetchNotificationSettings = async () => {
      setIsLoading(true)
      try {
        // Replace with your actual API endpoint
        const response = await fetch("/api/notification-settings")
        if (!response.ok) throw new Error("Failed to fetch settings")
        const data: NotificationsFormValues = await response.json()
        form.reset(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load notification settings",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchNotificationSettings()
  }, [form])

  async function onSubmit(data: NotificationsFormValues) {
    setIsSubmitting(true)
    try {
      // Replace with your actual API endpoint
      const response = await fetch("/api/notification-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error("Failed to update settings")
      toast({
        title: "Success",
        description: "Notification settings updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading notification settings...</p>
        </div>
      </div>
    )
  }

  const notificationTypes = [
    {
      value: "all",
      label: "All notifications",
      description: "Get notified about all activity and updates",
      icon: Bell,
      color: "bg-blue-50 border-blue-200 text-blue-700",
    },
    {
      value: "none",
      label: "No notifications",
      description: "Turn off all notifications",
      icon: BellOff,
      color: "bg-gray-50 border-gray-200 text-gray-700",
    },
  ]

  const emailSettings = [
    {
      name: "communication_emails" as const,
      label: "Communication emails",
      description: "Receive emails about your account activity and important updates",
      icon: Mail,
      required: false,
    },
    {
      name: "security_emails" as const,
      label: "Security alerts",
      description: "Critical security notifications and account protection alerts",
      icon: Shield,
      required: true,
    },
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
    
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Notification Type Selection */}
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Frequency
              </CardTitle>
              <CardDescription>Choose how often you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid gap-4"
                        disabled={isSubmitting}
                      >
                        {notificationTypes.map((type) => {
                          const Icon = type.icon
                          const isSelected = field.value === type.value
                          return (
                            <FormItem key={type.value}>
                              <FormControl>
                                <div className="relative">
                                  <RadioGroupItem value={type.value} className="sr-only" />
                                  <label
                                    htmlFor={type.value}
                                    className={`
                                      flex items-start space-x-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md
                                      ${
                                        isSelected
                                          ? "border-primary bg-primary/5 shadow-sm"
                                          : "border-border hover:border-primary/50"
                                      }
                                    `}
                                  >
                                    <div
                                      className={`
                                      flex items-center justify-center w-10 h-10 rounded-full transition-colors
                                      ${isSelected ? type.color : "bg-muted"}
                                    `}
                                    >
                                      <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{type.label}</span>
                                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                      </div>
                                      <p className="text-sm text-muted-foreground">{type.description}</p>
                                    </div>
                                  </label>
                                </div>
                              </FormControl>
                            </FormItem>
                          )
                        })}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Email Notifications */}
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>Configure which types of emails you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {emailSettings.map((setting, index) => {
                const Icon = setting.icon
                return (
                  <div key={setting.name}>
                    <FormField
                      control={form.control}
                      name={setting.name}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start justify-between rounded-lg border p-4 space-y-0">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <FormLabel className="text-base font-medium">{setting.label}</FormLabel>
                                {setting.required && (
                                  <Badge variant="secondary" className="text-xs">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              <FormDescription className="text-sm">{setting.description}</FormDescription>
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isSubmitting || setting.required}
                              aria-readonly={setting.required}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    {index < emailSettings.length - 1 && <Separator className="my-4" />}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <Button type="submit" disabled={isSubmitting} size="lg" className="min-w-[200px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Update Preferences
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
