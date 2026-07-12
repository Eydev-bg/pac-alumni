@component('mail::message')
# {{ $eventTitle }}

Hello {{ $recipientName }},

A new event has been published and you're invited.

**Where:** {{ $eventLocation }}<br>
**When:** {{ $startDatetime }}

{{ $eventBody }}

@if ($actionUrl)
@component('mail::button', ['url' => $actionUrl])
View Event
@endcomponent
@endif

Thanks,<br>
{{ config('app.name') }}
@endcomponent
