import { NextResponse } from 'next/server'

export async function GET() {
  const identityAssociation = {
    "associatedApplications": [
      {
        "applicationId": "73a6700e-bd6c-41e7-8d6d-fb90b8466313"
      }
    ]
  }

  return NextResponse.json(identityAssociation, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  })
}