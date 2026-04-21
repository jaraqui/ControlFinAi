import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Wallet } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="container flex flex-col items-center gap-6 px-4 py-16">
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Wallet className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold">ControlFinAi</h1>
        </div>

        <p className="text-center text-muted-foreground max-w-md">
          Controle suas finanças de forma simples e eficiente. Faça login com sua conta Google para começar.
        </p>

        <Button onClick={login} size="lg" className="mt-4">
          Entrar com Google
        </Button>
      </div>
    </div>
  )
}