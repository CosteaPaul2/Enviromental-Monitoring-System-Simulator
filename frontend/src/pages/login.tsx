import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@heroui/button"
import { Input } from "@heroui/input"
import { Link } from "@heroui/link"
import { Form } from "@heroui/form"
import { Icon } from "@iconify/react"
import { useAuth } from "@/contexts/AuthContext"

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [formError, setFormError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message)
    }
  }, [location])

  const toggleVisibility = () => setIsVisible(!isVisible)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFormError("")
    setSuccessMessage("")

    const result = await login(email, password)

    if (result.success) {
      navigate("/dashboard")
    } else {
      setFormError(result.error || "Login failed")
    }

    setLoading(false)
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
        <div className="flex flex-col gap-1">
          <h1 className="text-large font-medium">Environmental Monitoring System</h1>
          <p className="text-small text-default-500">Sign in to access your dashboard</p>
        </div>

        {successMessage && (
          <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-large" role="alert">
            <div className="flex items-center gap-2">
              <Icon icon="tabler:check" className="text-lg" />
              <span className="text-small">{successMessage}</span>
            </div>
          </div>
        )}

        {formError && (
          <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-large" role="alert">
            <div className="flex items-center gap-2">
              <Icon icon="tabler:alert-circle" className="text-lg" />
              <span className="text-small">{formError}</span>
            </div>
          </div>
        )}

        <Form className="flex flex-col gap-3" validationBehavior="native" onSubmit={handleSubmit}>
          <Input
            isRequired
            label="Email Address"
            name="email"
            placeholder="Enter your email"
            type="email"
            variant="bordered"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            startContent={
              <Icon 
                icon="tabler:mail" 
                className="text-xl text-default-400 pointer-events-none flex-shrink-0" 
              />
            }
          />
          
          <Input
            isRequired
            endContent={
              <button 
                type="button" 
                onClick={toggleVisibility}
                className="focus:outline-none"
              >
                <Icon
                  className="text-xl text-default-400 pointer-events-none"
                  icon={isVisible ? "tabler:eye-off" : "tabler:eye"}
                />
              </button>
            }
            label="Password"
            name="password"
            placeholder="Enter your password"
            type={isVisible ? "text" : "password"}
            variant="bordered"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            startContent={
              <Icon 
                icon="tabler:lock" 
                className="text-xl text-default-400 pointer-events-none flex-shrink-0" 
              />
            }
          />
          
          <Button 
            className="w-full" 
            color="primary" 
            type="submit" 
            disabled={loading}
            startContent={
              loading ? (
                <Icon icon="tabler:loader" className="animate-spin" />
              ) : (
                <Icon icon="tabler:login" />
              )
            }
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </Form>
        
        <p className="text-center text-small">
          Need to create an account?&nbsp;
          <Link href="/register" size="sm">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}