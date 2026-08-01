@component('mail::message')
# Verify Your Email Address

Hello {{ $userName }},

Thanks for registering with the PAC Alumni Portal! Please confirm your email address by clicking the button below.

@component('mail::button', ['url' => $verificationUrl])
Verify Email Address
@endcomponent

This link will expire in **24 hours**. You won't be able to log in until your email is verified. If you did not create this account, no action is needed.

If you're having trouble clicking the "Verify Email Address" button, copy and paste the URL below into your web browser:

{{ $verificationUrl }}

Thanks,<br>
{{ config('app.name') }}
@endcomponent