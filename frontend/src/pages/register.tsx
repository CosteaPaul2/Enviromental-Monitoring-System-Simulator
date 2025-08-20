import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@heroui/button"
import { Input } from "@heroui/input"
import { Link } from "@heroui/link"
import { Form } from "@heroui/form"
import { Icon } from "@iconify/react"
import { useAuth } from "@/contexts/AuthContext"

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [formError, setFormError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isConfirmVisible, setIsConfirmVisible] = useState(false)

  const toggleVisibility = () => setIsVisible(!isVisible)
  const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFormError("")

    if (password !== confirmPassword) {
      setFormError("Passwords don't match")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    const result = await register(name, email, password)

    if (result.success) {
      navigate("/login", { 
        state: { message: "Account created successfully! Please sign in." }
      })
    } else {
      setFormError(result.error || "Registration failed")
    }

    setLoading(false)
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
        <div className="flex flex-col gap-1">
          <h1 className="text-large font-medium">Create Your Account</h1>
          <p className="text-small text-default-500">Join the Environmental Monitoring System</p>
        </div>

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
            label="Full Name"
            name="name"
            placeholder="Enter your full name"
            type="text"
            variant="bordered"
            value={name}
            onChange={(e) => setName(e.target.value)}
            startContent={
              <Icon 
                icon="tabler:user" 
                className="text-xl text-default-400 pointer-events-none flex-shrink-0" 
              />
            }
          />

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

          <Input
            isRequired
            endContent={
              <button 
                type="button" 
                onClick={toggleConfirmVisibility}
                className="focus:outline-none"
              >
                <Icon
                  className="text-xl text-default-400 pointer-events-none"
                  icon={isConfirmVisible ? "tabler:eye-off" : "tabler:eye"}
                />
              </button>
            }
            label="Confirm Password"
            name="confirmPassword"
            placeholder="Confirm your password"
            type={isConfirmVisible ? "text" : "password"}
            variant="bordered"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
                <Icon icon="tabler:user-plus" />
              )
            }
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </Form>
        
        <p className="text-center text-small">
          Already have an account?&nbsp;
          <Link href="/login" size="sm">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}