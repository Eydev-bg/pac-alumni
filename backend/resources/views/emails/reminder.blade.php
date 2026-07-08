@component('mail::message')
# Hello {{ $recipientName }},

{{ $bodyMessage }}

@if ($actionUrl)
@component('mail::button', ['url' => $actionUrl])
{{ $actionLabel }}
@endcomponent
@endif

Thanks,<br>
{{ config('app.name') }}
@endcomponent
