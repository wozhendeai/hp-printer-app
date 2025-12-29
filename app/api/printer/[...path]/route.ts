import { NextRequest, NextResponse } from "next/server";

const PRINTER_IP = "192.168.1.62";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const printerPath = "/" + path.join("/");
  const url = `http://${PRINTER_IP}${printerPath}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/xml, text/xml, */*",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Printer returned ${response.status}` },
        { status: response.status },
      );
    }

    const contentType = response.headers.get("content-type") || "text/xml";
    const body = await response.text();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to reach printer: ${message}` },
      { status: 502 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const printerPath = "/" + path.join("/");
  const url = `http://${PRINTER_IP}${printerPath}`;

  try {
    const body = await request.text();

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/xml",
      },
      body,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Printer returned ${response.status}` },
        { status: response.status },
      );
    }

    const responseBody = await response.text();
    return new NextResponse(responseBody || "OK", {
      status: response.status || 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to reach printer: ${message}` },
      { status: 502 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const printerPath = "/" + path.join("/");
  const url = `http://${PRINTER_IP}${printerPath}`;

  try {
    const body = await request.text();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/xml",
      },
      body,
    });

    const responseBody = await response.text();
    const headers: Record<string, string> = {};

    // Forward Location header for scan jobs
    const location = response.headers.get("location");
    if (location) {
      // Rewrite printer URL to proxy URL
      headers["Location"] = location.replace(
        `http://${PRINTER_IP}`,
        "/api/printer",
      );
    }

    return new NextResponse(responseBody || "OK", {
      status: response.status,
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to reach printer: ${message}` },
      { status: 502 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const printerPath = "/" + path.join("/");
  const url = `http://${PRINTER_IP}${printerPath}`;

  try {
    const response = await fetch(url, {
      method: "DELETE",
    });

    return new NextResponse(null, {
      status: response.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to reach printer: ${message}` },
      { status: 502 },
    );
  }
}
