import { NextResponse } from "next/server";
import { fetchAdminMetrics } from "@/lib/admin/admin-metrics";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    // Check if user is authenticated and has admin role
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    // Fetch admin metrics
    const metrics = await fetchAdminMetrics();
    
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching admin metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin metrics" },
      { status: 500 }
    );
  }
}
