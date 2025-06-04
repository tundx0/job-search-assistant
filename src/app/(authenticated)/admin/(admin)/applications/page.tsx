import { prisma } from "@/lib/db/prisma";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Search,
  MoreHorizontal,
  FileText,
  ExternalLink,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Prisma } from "@prisma/client";

// Get color based on score
function getScoreColor(score: number) {
  if (score >= 80) return "bg-green-100 text-green-800";
  if (score >= 60) return "bg-blue-100 text-blue-800";
  if (score >= 40) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

// Get status badge style
function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "submitted":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          {status}
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          {status}
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          {status}
        </Badge>
      );
    case "interview":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          {status}
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
          {status}
        </Badge>
      );
  }
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const searchParamsMod = await searchParams;
  const page = Number(searchParamsMod.page) || 1;
  const search = searchParamsMod.search || "";
  const statusFilter = searchParamsMod.status || "";
  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  // Build filter conditions
  const whereConditions: Prisma.JobApplicationWhereInput = {};

  if (search) {
    whereConditions.OR = [
      { companyName: { contains: search, mode: "insensitive" } },
      { jobTitle: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (statusFilter) {
    whereConditions.status = statusFilter;
  }

  // Get total count for pagination
  const totalApplications = await prisma.jobApplication.count({
    where: whereConditions,
  });

  // Fetch applications with user info
  const applications = await prisma.jobApplication.findMany({
    where: whereConditions,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      resumeInsight: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: pageSize,
  });

  const totalPages = Math.ceil(totalApplications / pageSize);

  // Get unique statuses for filter
  const statuses = await prisma.jobApplication.findMany({
    select: {
      status: true,
    },
    distinct: ["status"],
  });

  const uniqueStatuses = statuses
    .map((s) => s.status)
    .filter(Boolean) as string[];

  return (
    <div className="space-y-4 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Job Applications
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View and manage all job applications in the system
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <form className="flex flex-col sm:flex-row w-full sm:w-auto items-start sm:items-center gap-2">
            <Input
              placeholder="Search applications..."
              name="search"
              defaultValue={search}
              className="w-full sm:w-48 md:w-64"
            />
            <select
              name="status"
              className="w-full sm:w-auto h-10 rounded-md border border-input bg-background px-3 py-2"
              defaultValue={statusFilter}
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" className="w-full sm:w-auto">
              <Search className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </form>
        </div>
      </div>

      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">All Applications</CardTitle>
          <CardDescription className="text-sm">
            Total of {totalApplications} job applications in the system
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6 overflow-x-auto">
          <div className="min-w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Job Title</TableHead>
                  <TableHead className="whitespace-nowrap hidden sm:table-cell">
                    Company
                  </TableHead>
                  <TableHead className="whitespace-nowrap">User</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap hidden md:table-cell">
                    Score
                  </TableHead>
                  <TableHead className="whitespace-nowrap hidden lg:table-cell">
                    Created
                  </TableHead>
                  <TableHead className="whitespace-nowrap hidden md:table-cell">
                    Documents
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium max-w-[150px] truncate">
                      {app.jobTitle}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {app.companyName}
                    </TableCell>
                    <TableCell className="max-w-[100px] truncate">
                      {app.user.name}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(app.status || "Unknown")}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {app.strengthScore !== null && (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getScoreColor(
                            app.strengthScore
                          )}`}
                        >
                          {app.strengthScore}%
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell whitespace-nowrap">
                      {formatDistanceToNow(new Date(app.createdAt))} ago
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-1 sm:space-y-0">
                        {app.tailoredResume && (
                          <a
                            href={app.tailoredResume}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-blue-600 hover:underline"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Resume
                          </a>
                        )}
                        {app.coverLetter && (
                          <a
                            href={app.coverLetter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-blue-600 hover:underline"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Cover Letter
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {app.jobUrl && (
                            <DropdownMenuItem>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              <a
                                href={app.jobUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center"
                              >
                                Job Posting
                              </a>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent className="flex flex-wrap justify-center">
                  {page > 1 && (
                    <PaginationItem>
                      <PaginationPrevious
                        href={`/admin/applications?page=${page - 1}${
                          search ? `&search=${search}` : ""
                        }${statusFilter ? `&status=${statusFilter}` : ""}`}
                      />
                    </PaginationItem>
                  )}

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show pages around the current page
                    let pageNum = page;
                    if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    if (pageNum > 0 && pageNum <= totalPages) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href={`/admin/applications?page=${pageNum}${
                              search ? `&search=${search}` : ""
                            }${statusFilter ? `&status=${statusFilter}` : ""}`}
                            isActive={pageNum === page}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}

                  {page < totalPages && (
                    <PaginationItem>
                      <PaginationNext
                        href={`/admin/applications?page=${page + 1}${
                          search ? `&search=${search}` : ""
                        }${statusFilter ? `&status=${statusFilter}` : ""}`}
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
