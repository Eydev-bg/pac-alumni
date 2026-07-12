@component('mail::message')
# New Job Opportunity

Hello {{ $recipientName }},

A new job opening may interest you: **{{ $jobPosition }}** at **{{ $companyName }}**.

**Location:** {{ $jobLocation }}<br>
**Employment Type:** {{ $employmentType }}

@if ($actionUrl)
@component('mail::button', ['url' => $actionUrl])
View Job Posting
@endcomponent
@endif

Thanks,<br>
{{ config('app.name') }}
@endcomponent
