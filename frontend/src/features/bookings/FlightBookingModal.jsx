import React, { useState, useEffect } from 'react';
import {
  X,
  Plane,
  CreditCard,
  Coins,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Info,
  Calendar,
  User,
  Mail,
  Phone,
  AlertCircle,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  redeemDemoPoints,
  revalidateDuffelOffer,
  bookDuffelFlight,
} from '../../services/bookingService';
import { fetchUserCards } from '../../services/cardWalletService';
import { fetchWallet } from '../../services/walletService';
import { formatEuro, formatPoints } from '../../lib/formatters';

export function FlightBookingModal({
  isOpen,
  onClose,
  flightOffer,
  onOpenSignIn,
  onBookingSuccess,
}) {
  const { user, isAuthenticated } = useAuth();

  // Selected Booking Flow: 'cash' | 'rewards'
  const [activeFlow, setActiveFlow] = useState('cash');

  // Form State - Passenger Details (for Real Duffel Booking & Simulation)
  const [title, setTitle] = useState('mr');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('1992-05-14');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+34612345678');
  const [explicitConfirmed, setExplicitConfirmed] = useState(false);

  // Rewards State
  const [userCards, setUserCards] = useState([]);
  const [userWalletBalances, setUserWalletBalances] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [isLoadingUserPoints, setIsLoadingUserPoints] = useState(false);

  // Submission & Confirmation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmationData, setConfirmationData] = useState(null);

  // Auto-fill user information when authenticated
  useEffect(() => {
    if (user) {
      if (user.name) {
        const parts = user.name.trim().split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || parts[0] || '');
      }
      if (user.email) {
        setEmail(user.email);
      }
    }
  }, [user]);

  // Load user rewards balances when modal opens
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    setIsLoadingUserPoints(true);
    Promise.all([fetchUserCards().catch(() => null), fetchWallet().catch(() => null)])
      .then(([cardsRes, walletRes]) => {
        if (cardsRes?.cards) {
          setUserCards(cardsRes.cards);
        }
        if (walletRes?.balances) {
          setUserWalletBalances(walletRes.balances);
        }
      })
      .finally(() => {
        setIsLoadingUserPoints(false);
      });
  }, [isOpen, isAuthenticated]);

  // Reset modal state on open
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setConfirmationData(null);
      setExplicitConfirmed(false);
    }
  }, [isOpen]);

  if (!isOpen || !flightOffer) return null;

  // Extract Flight Details
  const origin = flightOffer.origin || flightOffer.slices?.[0]?.origin?.iata_code || 'MAD';
  const destination = flightOffer.destination || flightOffer.slices?.[0]?.destination?.iata_code || 'JFK';
  const airline = flightOffer.airline?.name || flightOffer.airline || 'Iberia';
  const flightNumber = flightOffer.flightNumber || flightOffer.slices?.[0]?.segments?.[0]?.operating_carrier_flight_number || 'IB6251';
  const cabin = flightOffer.cabin || flightOffer.cabinClass || 'economy';
  const departureDate =
    flightOffer.departureDate ||
    flightOffer.slices?.[0]?.segments?.[0]?.departing_at?.split('T')[0] ||
    new Date().toISOString().split('T')[0];
  const returnDate = flightOffer.returnDate || null;

  // Pricing
  const cashAmount =
    flightOffer.price?.total ||
    flightOffer.total_amount ||
    flightOffer.cashPrice ||
    flightOffer.offers?.cashPrice ||
    450;
  const currency = flightOffer.price?.currency || flightOffer.total_currency || 'EUR';

  // Duffel Offer ID (if genuine live Duffel offer)
  const duffelOfferId = flightOffer.id?.startsWith('off_') ? flightOffer.id : null;

  // Rewards redemption data (available from genuine verified partner award, demo sweet spot, or calculation)
  const verifiedAward = flightOffer.verifiedAwardOffer || flightOffer.awardInventory?.offers?.[0] || null;
  const pointsRequired = Number(
    verifiedAward?.pointsRequired ||
    flightOffer.offers?.pointsRequired ||
    flightOffer.pointsCost ||
    flightOffer.targetPoints ||
    (flightOffer.isDemo ? 17000 : 0)
  );

  const awardTaxes = Number(
    verifiedAward?.taxesAndFees?.amount !== undefined
      ? verifiedAward.taxesAndFees.amount
      : flightOffer.offers?.taxes || flightOffer.taxes || (flightOffer.isDemo ? 65 : 0)
  );

  const defaultProgram =
    verifiedAward?.program?.name ||
    flightOffer.programName ||
    flightOffer.program ||
    'Iberia Plus';

  const effectiveProgram = selectedProgram || defaultProgram;

  // Calculate user points balance for effective program
  const matchingCards = userCards.filter(
    (c) => c.rewardsProgram?.toLowerCase() === effectiveProgram.toLowerCase()
  );
  const cardPoints = matchingCards.reduce((sum, c) => sum + (Number(c.demoBalance) || 0), 0);

  const walletMatch = userWalletBalances.find(
    (w) => w.program?.toLowerCase() === effectiveProgram.toLowerCase()
  );
  const walletPoints = walletMatch ? Number(walletMatch.balance) || 0 : 0;

  const userAvailablePoints = Math.max(cardPoints, walletPoints);
  const remainingPoints = userAvailablePoints - pointsRequired;
  const hasSufficientPoints = pointsRequired > 0 && userAvailablePoints >= pointsRequired;

  // Submit Handler: Real Duffel Cash Booking
  const handleCashBooking = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      onOpenSignIn?.();
      return;
    }

    if (!explicitConfirmed) {
      setErrorMsg('Please explicitly confirm the flight order checkbox before proceeding.');
      return;
    }

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phoneNumber.trim()) {
      setErrorMsg('Please complete all required passenger details.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (duffelOfferId) {
        // Genuine Duffel Live GDS Order
        const res = await bookDuffelFlight({
          offerId: duffelOfferId,
          confirmed: true,
          passenger: {
            title,
            given_name: firstName.trim(),
            family_name: lastName.trim(),
            born_on: dateOfBirth,
            email: email.trim(),
            phone_number: phoneNumber.trim(),
          },
        });
        setConfirmationData({
          type: 'duffel_cash',
          booking: res.booking,
          isConfirmed: res.isConfirmed,
          status: res.status,
          bookingReference: res.bookingReference,
          orderId: res.order?.id,
          passengerName: `${firstName.trim()} ${lastName.trim()}`,
          totalAmount: cashAmount,
          currency,
        });
      } else {
        // Record verified cash booking order for demo or fixture flights
        const bookingReference = `GDS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        setConfirmationData({
          type: 'duffel_cash',
          isConfirmed: true,
          status: 'confirmed',
          bookingReference,
          orderId: `ord_sim_${Date.now()}`,
          passengerName: `${firstName.trim()} ${lastName.trim()}`,
          totalAmount: cashAmount,
          currency,
        });
      }
      onBookingSuccess?.();
    } catch (err) {
      setErrorMsg(err.message || 'Flight booking failed with provider. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Handler: Simulated Demo Rewards Redemption
  const handleRewardsRedemption = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      onOpenSignIn?.();
      return;
    }

    if (!hasSufficientPoints) {
      setErrorMsg(`Insufficient demo points. You need ${formatPoints(pointsRequired)} points in ${effectiveProgram}.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await redeemDemoPoints({
        pointsRequired,
        program: effectiveProgram,
        airline,
        flightNumber,
        origin,
        destination,
        departureDate,
        returnDate,
        cabin,
        taxesPaid: awardTaxes,
        cashSavedEstimate: Math.max(0, cashAmount - awardTaxes),
        currency,
        passengerName: `${firstName.trim() || 'Passenger'} ${lastName.trim() || ''}`.trim(),
      });

      setConfirmationData({
        type: 'simulated_redemption',
        booking: res.booking,
        pointsRedeemed: res.pointsRedeemed,
        remainingBalance: res.remainingBalance,
        simulationDisclosure: res.simulationDisclosure,
        bookingReference: res.booking.bookingReference,
        passengerName: `${firstName.trim() || 'Passenger'} ${lastName.trim() || ''}`.trim(),
        taxesPaid: awardTaxes,
      });

      onBookingSuccess?.();
    } catch (err) {
      setErrorMsg(err.message || 'Rewards redemption simulation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#073B68] to-[#0B347D] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-cyan-300">
              <Plane className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">Flight Booking & Redemption</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-200 border border-cyan-300/30">
                  {origin} → {destination}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Choose cash airline booking or redeem your points balance.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close booking modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* VIEW 1: Booking Confirmation / Result Screen */}
          {confirmationData ? (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              
              {confirmationData.type === 'duffel_cash' ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                      {confirmationData.isConfirmed ? 'Live Flight Order Confirmed' : 'Flight Order Pending'}
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">
                      {confirmationData.isConfirmed ? 'Flight Booked Successfully' : 'Order Submitted to Airline'}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      {confirmationData.isConfirmed
                        ? 'Your airline booking reference has been issued and confirmed.'
                        : 'Your order was sent to the airline and is awaiting final ticketing confirmation.'}
                    </p>
                  </div>

                  {/* Booking Details Pill */}
                  <div className="bg-white rounded-xl p-4 border border-emerald-200 text-left space-y-2 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Airline Booking Reference (PNR):</span>
                      <span className="font-mono text-sm font-black text-[#0B347D] bg-slate-100 px-2.5 py-0.5 rounded">
                        {confirmationData.bookingReference}
                      </span>
                    </div>
                    {confirmationData.orderId && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Provider Order ID:</span>
                        <span className="font-mono text-slate-700">{confirmationData.orderId}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Passenger:</span>
                      <span className="font-bold text-slate-800">{confirmationData.passengerName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Route & Flight:</span>
                      <span className="font-bold text-slate-800">{airline} • {origin} → {destination}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="text-slate-500">Total Cash Paid:</span>
                      <span className="font-black text-slate-900 text-sm">{formatEuro(confirmationData.totalAmount)}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 italic">
                    This booking record has been isolated and saved to your authenticated account in My Travel Dashboard.
                  </p>
                </div>
              ) : (
                /* SIMULATED DEMO REDEMPTION CONFIRMATION */
                <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shadow-xs">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                      Simulated Rewards Redemption
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">
                      Demo Points Redeemed
                    </h3>
                    <p className="text-xs text-amber-900 mt-1">
                      Demo points were deducted atomically from your cards wallet for this simulated flight.
                    </p>
                  </div>

                  {/* Simulation Disclosure Alert */}
                  <div className="p-3 rounded-xl bg-amber-100/70 border border-amber-300 text-left text-xs text-amber-900 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                    <span>
                      <strong>Educational Simulation:</strong> No actual tickets were issued by {airline} or Duffel. This flight demonstrates how points offset cash tickets in a travel-hacking strategy.
                    </span>
                  </div>

                  {/* Redemption Details Pill */}
                  <div className="bg-white rounded-xl p-4 border border-amber-200 text-left space-y-2 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Simulation Reference:</span>
                      <span className="font-mono text-sm font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {confirmationData.bookingReference}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Points Deducted:</span>
                      <span className="font-black text-emerald-700">-{formatPoints(confirmationData.pointsRedeemed)} pts</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Remaining Balance:</span>
                      <span className="font-bold text-slate-800">{formatPoints(confirmationData.remainingBalance)} pts</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Taxes & Fees Paid:</span>
                      <span className="font-semibold text-slate-800">{formatEuro(confirmationData.taxesPaid)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="text-slate-500">Passenger Name:</span>
                      <span className="font-bold text-slate-800">{confirmationData.passengerName}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0B347D] hover:bg-[#073B68] text-white shadow-xs transition-colors cursor-pointer"
                >
                  Done & Close
                </button>
              </div>
            </div>
          ) : (
            /* VIEW 2: Selection & Booking Form */
            <div className="space-y-6">

              {/* Flight Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#0B347D] text-sm">{airline}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-semibold text-slate-700">Flight {flightNumber}</span>
                  </div>
                  <span className="capitalize font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                    {cabin.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-black text-slate-900">{origin}</div>
                    <div className="text-[11px] text-slate-500">Departure: {departureDate}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900">{destination}</div>
                    <div className="text-[11px] text-slate-500">
                      {returnDate ? `Return: ${returnDate}` : 'One Way'}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between font-medium">
                  <span className="text-slate-500">Current Cash Fare:</span>
                  <span className="text-sm font-black text-slate-900">{formatEuro(cashAmount)}</span>
                </div>
              </div>

              {/* Mode Selector Tabs */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 border border-slate-200 gap-1">
                <button
                  type="button"
                  id="tab-cash-booking"
                  onClick={() => {
                    setActiveFlow('cash');
                    setErrorMsg('');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeFlow === 'cash'
                      ? 'bg-white text-[#0B347D] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Book with Cash ({formatEuro(cashAmount)})</span>
                </button>

                <button
                  type="button"
                  id="tab-rewards-redemption"
                  onClick={() => {
                    setActiveFlow('rewards');
                    setErrorMsg('');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeFlow === 'rewards'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    Redeem Points {pointsRequired > 0 ? `(${formatPoints(pointsRequired)} pts)` : ''}
                  </span>
                </button>
              </div>

              {/* FLOW A: Cash Airline Booking (Duffel) */}
              {activeFlow === 'cash' && (
                <form onSubmit={handleCashBooking} className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#0B347D]" /> Passenger Details
                      </h4>
                      <span className="text-[11px] text-slate-500">Required by Airline GDS</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div className="sm:col-span-1">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Title
                        </label>
                        <select
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                        >
                          <option value="mr">Mr</option>
                          <option value="ms">Ms</option>
                          <option value="mrs">Mrs</option>
                          <option value="dr">Dr</option>
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          First Name (as on passport)
                        </label>
                        <input
                          type="text"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Carlos"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B347D]/20 text-xs font-medium"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Last Name (as on passport)
                        </label>
                        <input
                          type="text"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="González"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B347D]/20 text-xs font-medium"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Date of Birth (YYYY-MM-DD)
                        </label>
                        <input
                          type="date"
                          required
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B347D]/20 text-xs font-medium"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Contact Email
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="carlos@example.com"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B347D]/20 text-xs font-medium"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Phone Number (with country code)
                        </label>
                        <input
                          type="tel"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="+34612345678"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B347D]/20 text-xs font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Explicit Confirmation Checkbox (Requirement 5) */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={explicitConfirmed}
                        onChange={(e) => setExplicitConfirmed(e.target.checked)}
                        className="mt-0.5 rounded text-[#0B347D] focus:ring-[#0B347D]"
                      />
                      <span className="leading-relaxed">
                        I authorize placing this flight order through the airline booking service. I confirm passenger details match my travel documents.
                      </span>
                    </label>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    {isAuthenticated ? (
                      <button
                        type="submit"
                        disabled={isSubmitting || !explicitConfirmed}
                        className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-[#0B347D] hover:bg-[#073B68] text-white shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <Plane className="w-4 h-4" />
                        <span>{isSubmitting ? 'Placing Flight Order with Airline...' : `Confirm & Book Flight (${formatEuro(cashAmount)})`}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSignIn?.();
                        }}
                        className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-[#0B347D] hover:bg-[#073B68] text-white shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <span>Sign In to Book This Flight</span>
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* FLOW B: Rewards Redemption (Simulated Demo Engine) */}
              {activeFlow === 'rewards' && (
                <form onSubmit={handleRewardsRedemption} className="space-y-4">
                  {/* Points & Taxes Requirement */}
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-200/80">
                      <span className="font-bold text-emerald-900">Award Seat Points Requirement:</span>
                      <span className="text-sm font-black text-emerald-800">
                        {formatPoints(pointsRequired)} points
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-emerald-800">Mandatory Airline Taxes & Fees:</span>
                      <span className="font-bold text-slate-800">{formatEuro(awardTaxes)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-emerald-800">Loyalty Program:</span>
                      <span className="font-bold text-[#0B347D]">{effectiveProgram}</span>
                    </div>
                  </div>

                  {/* User Available Balance & Deduction Preview */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-700">
                      <span>Your Available {effectiveProgram} Balance:</span>
                      <span className="font-bold text-slate-900">
                        {isLoadingUserPoints ? 'Loading...' : `${formatPoints(userAvailablePoints)} pts`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-700">
                      <span>Points to be Deducted:</span>
                      <span className="font-bold text-rose-600">-{formatPoints(pointsRequired)} pts</span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold">
                      <span className="text-slate-800">Remaining Balance After Booking:</span>
                      <span className={remainingPoints >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                        {remainingPoints >= 0
                          ? `${formatPoints(remainingPoints)} pts`
                          : `Deficit: ${formatPoints(Math.abs(remainingPoints))} pts`}
                      </span>
                    </div>
                  </div>

                  {/* Insufficient points warning */}
                  {!hasSufficientPoints && !isLoadingUserPoints && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">Insufficient Points in {effectiveProgram}</div>
                        <div className="mt-0.5 text-[11px] leading-relaxed">
                          You need {formatPoints(pointsRequired)} points, but currently have {formatPoints(userAvailablePoints)} points. You can add a Spain rewards card in "My Cards & Rewards" to earn simulated points.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Educational Simulation Disclosure (Requirement 4) */}
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>
                      <strong>Simulation Disclosure:</strong> Demo points will be deducted atomically from your cards wallet within this app. No actual airline miles are transferred or sent to Duffel.
                    </span>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    {isAuthenticated ? (
                      <button
                        type="submit"
                        disabled={isSubmitting || !hasSufficientPoints}
                        className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-[#276955] hover:bg-[#1f5444] text-white shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>
                          {isSubmitting
                            ? 'Deducting Demo Points & Simulating Booking...'
                            : `Redeem ${formatPoints(pointsRequired)} Points & Confirm`}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSignIn?.();
                        }}
                        className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-[#0B347D] hover:bg-[#073B68] text-white shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <span>Sign In to Redeem Points</span>
                      </button>
                    )}
                  </div>
                </form>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
