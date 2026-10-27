// actions/crm/bookings.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/session";
import type { Currency } from "@prisma/client";

export type BookingActionResult =
  | { success: true; id?: string; bookingCode?: string }
  | { success: false; error: string };

// ── 1. Summer Allocations CRUD (Section 7 [P1]) ──────────────────────────────

export interface SummerAllocationInput {
  country: string;
  centerName: string;
  nights: number;
  startDate: string;
  endDate?: string;
  totalQuota: number;
  pricePerStudent?: number;
  currency?: Currency;
  notes?: string;
}

export async function createSummerAllocation(
  input: SummerAllocationInput,
): Promise<BookingActionResult> {
  await requireStaff();

  if (!input.country || !input.centerName || !input.startDate) {
    return { success: false, error: "Ülke, Merkez Adı ve Başlangıç Tarihi zorunludur." };
  }

  const allocation = await prisma.summerAllocation.create({
    data: {
      country: input.country,
      centerName: input.centerName,
      nights: Number(input.nights) || 14,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : null,
      totalQuota: Number(input.totalQuota) || 20,
      pricePerStudent: input.pricePerStudent ? Number(input.pricePerStudent) : null,
      currency: input.currency || "GBP",
      notes: input.notes || null,
      isActive: true,
    },
  });

  revalidatePath("/summer-camp/catalog");
  revalidatePath("/groups");
  return { success: true, id: allocation.id };
}

// ── 2. 6-Step Summer Booking Wizard Submission (Section 7 [P1]) ──────────────

export interface SummerBookingWizardInput {
  termsAccepted: boolean;
  allocationId?: string | null;
  groupName?: string;
  country: string;
  centerName: string;
  nights: number;
  startDate: string;
  participantCount: number;
  studentIds?: string[];
  airportTransfers?: {
    arrivalAirport?: string;
    arrivalFlightNo?: string;
    arrivalDateTime?: string;
    departureAirport?: string;
    departureFlightNo?: string;
    departureDateTime?: string;
    transferIncluded?: boolean;
  };
  extraServices?: {
    excursions?: string[];
    travelInsurance?: boolean;
    mealPlan?: string;
    groupLeaderCount?: number;
  };
  totalAmount?: number;
  currency?: Currency;
  summaryNotes?: string;
}

export async function createSummerBooking(
  input: SummerBookingWizardInput,
): Promise<BookingActionResult> {
  await requireStaff();

  if (!input.termsAccepted) {
    return { success: false, error: "Rezervasyon için şartlar ve koşulları onaylamalısınız." };
  }
  if (!input.country || !input.centerName || !input.startDate) {
    return { success: false, error: "Ülke, merkez ve başlangıç tarihi seçilmelidir." };
  }

  const count = await prisma.summerBooking.count();
  const bookingCode = `BK-2026-${String(count + 101).padStart(3, "0")}`;
  const groupLabel = input.groupName || `${input.centerName} (${bookingCode})`;

  const booking = await prisma.$transaction(async (tx) => {
    const created = await tx.summerBooking.create({
      data: {
        bookingCode,
        groupName: groupLabel,
        allocationId: input.allocationId || null,
        country: input.country,
        centerName: input.centerName,
        nights: Number(input.nights) || 14,
        startDate: new Date(input.startDate),
        participantCount: Number(input.participantCount) || 1,
        termsAccepted: true,
        airportTransfers: input.airportTransfers || {},
        extraServices: input.extraServices || {},
        totalAmount: input.totalAmount ? Number(input.totalAmount) : null,
        currency: input.currency || "GBP",
        summaryNotes: input.summaryNotes || null,
        status: "CONFIRMED",
      },
    });

    if (input.allocationId) {
      await tx.summerAllocation.update({
        where: { id: input.allocationId },
        data: {
          usedQuota: { increment: Number(input.participantCount) || 1 },
        },
      });
    }

    if (input.studentIds && input.studentIds.length > 0) {
      await tx.student.updateMany({
        where: { id: { in: input.studentIds } },
        data: {
          summerBookingId: created.id,
          groupName: groupLabel,
        },
      });
    }

    return created;
  });

  revalidatePath("/summer-camp/catalog");
  revalidatePath("/summer-camp/students");
  revalidatePath("/groups");
  return { success: true, id: booking.id, bookingCode: booking.bookingCode };
}
