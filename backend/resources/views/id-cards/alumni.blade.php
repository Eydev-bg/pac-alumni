<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Alumni ID — {{ $alumniIdNumber }}</title>
    {{--
        CR80 landscape card rendered by dompdf at 96dpi → 324px × 204px.
        Two pages: front, then back (page-break-before) for duplex printing.
        dompdf has limited CSS support, so this uses absolute positioning
        only (no flexbox/grid). Inter/Playfair Display are not bundled with
        dompdf; the built-in Times (serif) and Helvetica (sans) stand in.
    --}}
    <style>
        @page { margin: 0; }
        * { margin: 0; padding: 0; }
        html, body {
            width: 324px;
            font-family: Helvetica, Arial, sans-serif;
            color: #0f1b3d;
            background: #ffffff;
        }
        .card {
            position: relative;
            width: 324px;
            height: 204px;
            overflow: hidden;
        }

        /* Header */
        .header {
            position: absolute;
            top: 0; left: 0;
            width: 324px;
            height: 40px;
            background: #0f1b3d;
            border-bottom: 2px solid #c8a84e;
        }
        .logo {
            position: absolute;
            top: 5px; left: 8px;
            width: 30px; height: 30px;
        }
        .college {
            position: absolute;
            top: 8px; left: 44px;
            font-family: Times, "Times New Roman", serif;
            font-weight: bold;
            font-size: 11px;
            color: #ffffff;
            letter-spacing: 0.3px;
        }
        .card-title {
            position: absolute;
            top: 23px; left: 44px;
            font-size: 6.5px;
            font-weight: bold;
            color: #c8a84e;
            letter-spacing: 1.2px;
        }

        /* Photo box */
        .photo-box {
            position: absolute;
            top: 52px; left: 12px;
            width: 76px; height: 92px;
            border: 1.5px solid #c8a84e;
            background: #0f1b3d;
            overflow: hidden;
        }
        .photo {
            width: 76px; height: 92px;
        }
        .initials {
            position: absolute;
            top: 30px; left: 0;
            width: 76px;
            text-align: center;
            font-family: Times, "Times New Roman", serif;
            font-weight: bold;
            font-size: 28px;
            line-height: 32px;
            color: #ffffff;
        }
        .silhouette {
            position: absolute;
            top: 38px; left: 0;
            width: 76px;
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            letter-spacing: 2px;
            color: #c8a84e;
        }

        /* Details */
        .details {
            position: absolute;
            top: 54px; left: 100px;
            width: 214px;
        }
        .label {
            font-size: 5.5px;
            font-weight: bold;
            color: #64748b;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .name {
            font-size: 12px;
            font-weight: bold;
            line-height: 14px;
            color: #0f1b3d;
            margin-bottom: 6px;
        }
        .id-number {
            font-family: Courier, monospace;
            font-size: 10px;
            font-weight: bold;
            color: #0f1b3d;
            margin-bottom: 6px;
        }
        .value {
            font-size: 8px;
            line-height: 10px;
            color: #1e293b;
            margin-bottom: 5px;
        }

        /* Footer */
        .footer {
            position: absolute;
            bottom: 0; left: 0;
            width: 324px;
            height: 22px;
            background: #0f1b3d;
            border-top: 2px solid #c8a84e;
        }
        .footer-text {
            position: absolute;
            top: 6px; left: 10px;
            width: 304px;
            text-align: center;
            font-size: 5.5px;
            line-height: 7px;
            color: #e2e8f0;
        }

        /* ── Back side ─────────────────────────────── */
        .card-back {
            page-break-before: always;
        }
        .back-top {
            position: absolute;
            top: 0; left: 0;
            width: 324px;
            height: 14px;
            background: #0f1b3d;
            border-bottom: 2px solid #c8a84e;
        }
        .back-bottom {
            position: absolute;
            bottom: 0; left: 0;
            width: 324px;
            height: 8px;
            background: #0f1b3d;
            border-top: 2px solid #c8a84e;
        }
        .terms {
            position: absolute;
            top: 23px; left: 14px;
            width: 296px;
        }
        .terms .label,
        .return-to .label {
            margin-bottom: 2px;
        }
        .term {
            position: relative;
            padding-left: 7px;
            font-size: 6px;
            line-height: 8px;
            color: #1e293b;
        }
        .term-dot {
            position: absolute;
            top: 0; left: 0;
            color: #c8a84e;
        }
        .return-to {
            position: absolute;
            top: 84px; left: 14px;
            width: 296px;
            font-size: 6px;
            line-height: 8px;
            color: #1e293b;
        }
        .return-to .strong {
            font-weight: bold;
            color: #0f1b3d;
        }
        .sig {
            position: absolute;
            top: 146px;
            width: 120px;
            border-top: 0.75px solid #0f1b3d;
            padding-top: 2px;
            text-align: center;
            font-size: 5.5px;
            line-height: 7px;
            color: #64748b;
        }
        .sig-holder { left: 14px; }
        .sig-registrar { left: 190px; }
        .sig .sig-name {
            font-size: 6.5px;
            font-weight: bold;
            color: #0f1b3d;
        }
        .date-issued {
            position: absolute;
            top: 178px; left: 14px;
            width: 296px;
            font-size: 6px;
            line-height: 8px;
            color: #1e293b;
        }
    </style>
</head>
<body>
<div class="card">
    <div class="header">
        @if ($logo)
            <img class="logo" src="{{ $logo }}" alt="PAC">
        @endif
        <div class="college">PHILIPPINE ADVENT COLLEGE, INC.</div>
        <div class="card-title">ALUMNI IDENTIFICATION CARD</div>
    </div>

    <div class="photo-box">
        @if ($photo)
            <img class="photo" src="{{ $photo }}" alt="{{ $fullName }}">
        @elseif ($initials !== '')
            <div class="initials">{{ $initials }}</div>
        @else
            <div class="silhouette">PAC</div>
        @endif
    </div>

    <div class="details">
        <div class="label">Name</div>
        <div class="name">{{ $fullName }}</div>

        <div class="label">Alumni ID</div>
        <div class="id-number">{{ $alumniIdNumber }}</div>

        @if ($program !== '')
            <div class="label">Program</div>
            <div class="value">{{ $program }}</div>
        @endif

        <div class="label">Batch</div>
        <div class="value">Batch {{ $graduationYear }}</div>
    </div>

    <div class="footer">
        <div class="footer-text">
            This card certifies the holder as a registered alumnus of Philippine Advent College, Inc.
        </div>
    </div>
</div>

<div class="card card-back">
    <div class="back-top"></div>

    <div class="terms">
        <div class="label">Terms and Conditions</div>
        <div class="term"><span class="term-dot">&bull;</span>This card is the property of {{ $institution }}</div>
        <div class="term"><span class="term-dot">&bull;</span>Non-transferable. Valid only for the person named on the front.</div>
        <div class="term"><span class="term-dot">&bull;</span>Present upon request at campus and alumni events.</div>
        <div class="term"><span class="term-dot">&bull;</span>Any alteration or tampering voids this card.</div>
    </div>

    <div class="return-to">
        <div class="label">If found, please return to:</div>
        <div class="strong">{{ $office }}, {{ $institution }}</div>
        <div>{{ $address }}</div>
        <div>Email: {{ $email }}&nbsp;&nbsp;&nbsp;Tel: {{ $phone }}</div>
    </div>

    <div class="sig sig-holder">Holder's Signature</div>
    <div class="sig sig-registrar">
        @if ($signatoryName !== '')
            <div class="sig-name">{{ $signatoryName }}</div>
        @endif
        <div>{{ $signatoryTitle }}</div>
    </div>

    <div class="date-issued">Date Issued: {{ $dateIssued }}</div>

    <div class="back-bottom"></div>
</div>
</body>
</html>
