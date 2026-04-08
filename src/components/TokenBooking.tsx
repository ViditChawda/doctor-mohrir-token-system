import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
// import { generateTokenPDF } from '@/lib/pdf'
import {
    getNextTokenNumber,
    addToken,
    getCurrentDateKey,
    clearOldTokens,
    subscribeToTokens,
    setActiveTokenForSlot,
    type Token
} from '@/api/tokens'
import { CheckCircle2 } from 'lucide-react'
// import { Download, CheckCircle2 } from 'lucide-react'

type Slot = 'morning' | 'evening'

const ACTIVE_ADMIN_UNLOCK_KEY = 'token-booking-active-admin-unlocked'
// UI-only gate. Change this PIN to whatever you want.
const ACTIVE_ADMIN_PIN = '1234'

interface SlotConfig {
    name: string
    startHour: number
    startMinute: number
    endHour: number
    endMinute: number
}

const SLOT_CONFIGS: Record<Slot, SlotConfig> = {
    morning: {
        name: 'Morning',
        startHour: 9,
        startMinute: 15,
        endHour: 12,
        endMinute: 30,
    },
    evening: {
        name: 'Evening',
        startHour: 17,
        startMinute: 45,
        endHour: 20,
        endMinute: 45,
    },
}

const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

const isSlotActive = (slot: Slot): boolean => {
    const now = new Date()
    const config = SLOT_CONFIGS[slot]

    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const startMinutes = config.startHour * 60 + config.startMinute
    const endMinutes = config.endHour * 60 + config.endMinute

    return currentMinutes >= startMinutes && currentMinutes < endMinutes
}

export default function TokenBooking() {
    const [currentDate, setCurrentDate] = useState<string>(getCurrentDateKey())
    const [morningTokens, setMorningTokens] = useState<Token[]>([])
    const [eveningTokens, setEveningTokens] = useState<Token[]>([])
    const [activeMorningTokenNumber, setActiveMorningTokenNumber] = useState<number | null>(null)
    const [activeEveningTokenNumber, setActiveEveningTokenNumber] = useState<number | null>(null)
    const [activeAdminUnlocked, setActiveAdminUnlocked] = useState<boolean>(() => {
        try {
            return localStorage.getItem(ACTIVE_ADMIN_UNLOCK_KEY) === 'true'
        } catch {
            return false
        }
    })
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
    const [patientName, setPatientName] = useState('')
    const [currentTime, setCurrentTime] = useState(new Date())
    const [loading, setLoading] = useState(false)
    const [successDialogOpen, setSuccessDialogOpen] = useState(false)
    const [bookedTokenNumber, setBookedTokenNumber] = useState<number | null>(null)
    const [bookedCustomerName, setBookedCustomerName] = useState<string>('')

    // Update time every minute and check for date changes
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date()
            setCurrentTime(now)

            const todayKey = getCurrentDateKey()

            // Check if date has changed (midnight reset)
            if (currentDate !== todayKey) {
                clearOldTokens(currentDate).then(() => {
                    setCurrentDate(todayKey)
                })
            }
        }, 60000) // Check every minute

        // Initial check
        const todayKey = getCurrentDateKey()
        if (currentDate !== todayKey) {
            clearOldTokens(currentDate).then(() => {
                setCurrentDate(todayKey)
            })
        }

        return () => clearInterval(interval)
    }, [currentDate])

    // Subscribe to real-time token updates for morning slot
    useEffect(() => {
        const unsubscribe = subscribeToTokens(currentDate, 'morning', (tokens) => {
            setMorningTokens(tokens)
            const active = tokens.find((t) => t.isActive)
            setActiveMorningTokenNumber(active ? active.tokenNumber : null)
        })

        return () => unsubscribe()
    }, [currentDate])

    // Subscribe to real-time token updates for evening slot
    useEffect(() => {
        const unsubscribe = subscribeToTokens(currentDate, 'evening', (tokens) => {
            setEveningTokens(tokens)
            const active = tokens.find((t) => t.isActive)
            setActiveEveningTokenNumber(active ? active.tokenNumber : null)
        })

        return () => unsubscribe()
    }, [currentDate])

    // Reset active token when date changes
    useEffect(() => {
        setActiveMorningTokenNumber(null)
        setActiveEveningTokenNumber(null)
    }, [currentDate])

    const handleBookToken = (slot: Slot) => {
        setSelectedSlot(slot)
        setPatientName('')
        setDialogOpen(true)
    }

    const handleConfirmBooking = async () => {
        if (!selectedSlot || !patientName.trim()) return

        setLoading(true)
        try {
            const tokenNumber = await getNextTokenNumber(currentDate, selectedSlot)
            const newToken = await addToken({
                tokenNumber,
                patientName: patientName.trim(),
                date: currentDate,
                slot: selectedSlot,
            })

            if (newToken) {
                setDialogOpen(false)
                setBookedTokenNumber(tokenNumber)
                setBookedCustomerName(patientName.trim())
                setPatientName('')
                setSelectedSlot(null)
                setSuccessDialogOpen(true)
            } else {
                alert('Failed to add token. Please try again.')
            }
        } catch (error) {
            console.error('Error booking token:', error)
            alert('Failed to book token. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleUnlockActiveAdmin = () => {
        const pin = window.prompt('Enter admin PIN to enable "Set Active"')
        if (!pin) return
        if (pin === ACTIVE_ADMIN_PIN) {
            setActiveAdminUnlocked(true)
            try {
                localStorage.setItem(ACTIVE_ADMIN_UNLOCK_KEY, 'true')
            } catch {
                // ignore
            }
        } else {
            alert('Wrong PIN')
        }
    }

    const handleLockActiveAdmin = () => {
        setActiveAdminUnlocked(false)
        try {
            localStorage.removeItem(ACTIVE_ADMIN_UNLOCK_KEY)
        } catch {
            // ignore
        }
    }

    // const handleDownloadPDF = (token: Token) => {
    //     generateTokenPDF({
    //         tokenNumber: token.tokenNumber,
    //         patientName: token.patientName,
    //         date: formatDate(new Date(token.date)),
    //         slot: token.slot,
    //     })
    // }

    const renderSlotSection = (slot: Slot) => {
        const config = SLOT_CONFIGS[slot]
        const tokens = slot === 'morning' ? morningTokens : eveningTokens
        const isActive = isSlotActive(slot)
        // const slotTime = slot === 'morning' ? '9:15 AM - 12:30 PM' : '5:45 PM - 8:45 PM'
        const activeTokenNumber = slot === 'morning' ? activeMorningTokenNumber : activeEveningTokenNumber

        return (
            <Card className="w-full md:p-0 p-0">
                <CardHeader>
                    <CardTitle className="flex items-center justify-center">
                        <span>{config.name} Tokens</span>
                        {/* <span className="text-sm font-normal text-muted-foreground">
                            {slotTime}
                        </span> */}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 md:p-0 p-2">

                    <div className="flex items-center justify-end gap-2">
                        {!activeAdminUnlocked ? (
                            <Button type="button" variant="outline" size="sm" onClick={handleUnlockActiveAdmin}>
                                Admin: Enable Set Active
                            </Button>
                        ) : (
                            <Button type="button" variant="outline" size="sm" onClick={handleLockActiveAdmin}>
                                Admin: Lock
                            </Button>
                        )}
                    </div>


                    {!isActive && (
                        <p className="text-sm text-muted-foreground md:text-center text-left">
                            Booking is only available from <span className="font-bold text-primary">{slot === 'morning' ? '9:15 AM to 12:30 PM' : '5:45 PM to 8:45 PM'}</span>
                        </p>
                    )}

                    {tokens.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm">Booked Tokens:</h3>
                            <div className="space-y-2">
                                {tokens.map((token) => (
                                    <div
                                        key={token.id}
                                        className={[
                                            'flex md:flex-row flex-col md:items-center items-start md:justify-between justify-start p-3 border rounded-lg transition-colors',
                                            activeTokenNumber !== null && token.tokenNumber === activeTokenNumber
                                                ? 'bg-green-100 border-green-300'
                                                : activeTokenNumber !== null && token.tokenNumber < activeTokenNumber
                                                    ? 'bg-red-100 border-red-300'
                                                    : 'bg-card',
                                        ].join(' ')}
                                    >
                                        <div>
                                            <p className="font-medium">
                                                Token #{token.tokenNumber} - {token.patientName}
                                            </p>
                                        </div>

                                        {activeAdminUnlocked && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={async () => {
                                                    if (slot === 'morning') setActiveMorningTokenNumber(token.tokenNumber)
                                                    else setActiveEveningTokenNumber(token.tokenNumber)

                                                    const ok = await setActiveTokenForSlot(currentDate, slot, token.tokenNumber)
                                                    if (!ok) {
                                                        alert('Failed to save active token. Please try again.')
                                                    }
                                                }}
                                                className="mt-2 md:mt-0"
                                            >
                                                Set Active
                                            </Button>
                                        )}
                                        {/* <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDownloadPDF(token)}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Download PDF
                                        </Button> */}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <Button
                        onClick={() => handleBookToken(slot)}
                        disabled={!isActive}
                        variant="default"
                        className=" bg-primary"
                    >
                        Book Token
                    </Button>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogContent className='bg-white'>
                            <DialogHeader>
                                <DialogTitle>
                                    Book {selectedSlot ? SLOT_CONFIGS[selectedSlot].name : ''} Token
                                </DialogTitle>
                                <DialogDescription>
                                    Enter the patient's name to issue a token.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        Patient Name
                                    </label>
                                    <Input
                                        value={patientName}
                                        onChange={(e) => setPatientName(e.target.value)}
                                        placeholder="Enter patient name"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && patientName.trim()) {
                                                handleConfirmBooking()
                                            }
                                        }}
                                        autoFocus
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleConfirmBooking}
                                        disabled={!patientName.trim() || loading}
                                    >
                                        {loading ? 'Booking...' : 'Confirm Booking'}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {tokens.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No tokens booked yet
                        </p>
                    )}
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="min-h-full bg-background">
            <div className=" space-y-6">
                {/* Date Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-2">Doctor Token Booking</h1>
                    <p className="text-lg text-muted-foreground">
                        {formatDate(currentTime)}
                    </p>
                </div>

                {/* Token Sections */}
                <div className={` grid gap-6 ${isSlotActive('evening') ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                    {renderSlotSection('morning')}
                    {isSlotActive('evening') && renderSlotSection('evening')}
                </div>

                {/* Booking Dialog */}


                {/* Success Dialog */}
                <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
                    <DialogContent className="bg-white text-center">
                        <div className="flex flex-col items-center space-y-4 py-4">
                            <div className="rounded-full bg-green-100 p-3 animate-in zoom-in-95 duration-300">
                                <CheckCircle2 className="h-12 w-12 text-green-600 animate-in zoom-in-95 duration-500" />
                            </div>
                            <DialogHeader className="space-y-2">
                                <DialogTitle className="text-2xl font-bold text-green-600 animate-in fade-in duration-500">
                                    Token Booked Successfully!
                                </DialogTitle>
                                <DialogDescription className="text-base pt-2 animate-in fade-in duration-500 delay-100">
                                    <div className="space-y-2">
                                        <p className="text-lg font-semibold text-foreground animate-in fade-in duration-500 delay-150">
                                            Token #{bookedTokenNumber}
                                        </p>
                                        <p className="text-muted-foreground animate-in fade-in duration-500 delay-200">
                                            has been booked for
                                        </p>
                                        <p className="text-xl font-bold text-primary animate-in fade-in duration-500 delay-300">
                                            {bookedCustomerName}
                                        </p>
                                    </div>
                                </DialogDescription>
                            </DialogHeader>
                            <div className="pt-4">
                                <Button
                                    onClick={() => setSuccessDialogOpen(false)}
                                    className="w-full sm:w-auto animate-in fade-in duration-500 delay-400"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}

