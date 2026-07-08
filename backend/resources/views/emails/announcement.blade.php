@component('mail::message')
# {{ $announcementTitle }}

Hello {{ $recipientName }},

{{ $announcementBody }}

@if ($actionUrl)
@component('mail::button', ['url' => $actionUrl])
View Announcement
@endcomponent
@endif

Thanks,<br>
{{ config('app.name') }}
@endcomponent
