## VICREO Tally listener

You can let this module work as a Tally light based on a selection of a variable. You select a variable you would like to have Tally on, like `atem:pgm1_input`.
Then put a value in the `Tally on Value` box like `CAM1`. Now your Blink will turn RED when your `atem:pgm1`_input variable hits CAM1 (so when pressing camera 1 on your ATEM mixer).

You can also compare against a variable. So if you want to know if your AUX1 has the same source as your PGM, type `atem:aux1_input` in the Tally On Value box.

When the Tally is on select 2 buttons to control something. For example program a light on and a second button for the lihjt to turn of

> This module check the value of the variables when a variable has been changed.
