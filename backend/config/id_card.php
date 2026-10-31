<?php

return [
    'office'          => env('ID_CARD_OFFICE', "Registrar's Office"),
    'institution'     => env('ID_CARD_INSTITUTION', 'Philippine Advent College, Inc.'),
    'address'         => env('ID_CARD_ADDRESS', 'Sindangan, Zamboanga del Norte'),
    'email'           => env('ID_CARD_EMAIL', 'philippineadventcollege@gmail.com'),
    'phone'           => env('ID_CARD_PHONE', '+63 939 918 5586'),
    // Leave the name empty to print a blank signature line (signed by hand).
    'signatory_name'  => env('ID_CARD_SIGNATORY_NAME', ''),
    'signatory_title' => env('ID_CARD_SIGNATORY_TITLE', 'School Registrar'),
];
