## Usage:
**hold space + left mouse** = move map around
**clicking arrow keys** = move selected object in arrow key direction by 1px
**hold shift** + clicking arrow keys = increase the size of selected object in arrow key direction by 1px
**hold alt** + moving selected object with mouse = copying selecting object
**ctrl + z** = does `.pop()` on `world.objects` (should be improved to proper ctrl + z for sure)
**calling `save()` in console** saves `world.objects` to `localStorage.map`
**calling `load()` in console** loads the `localStorage.map` to `world.objects`
viewport size (how much of the map you can see) can be changed in index.html on canvas element

## Workflow:
Specify the map image in `init()` method of world.js. Then load up the app and start the work by creating wireframes for solid objects like floor and walls. Don't forget to save!

## Misc:
Red rectangle represents the idlezone - the zone, motion of dave within which would not cause the camera to move

Light blue rectangle - the lifearea, beyond it life in game stops.

You can turn them off by commenting out appropriate functions within app.js's `render()` function.
