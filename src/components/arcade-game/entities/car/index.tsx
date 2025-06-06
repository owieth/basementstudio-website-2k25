import { forwardRef, useEffect, useMemo, useRef, useState } from "react"
import { mergeRefs } from "react-merge-refs"
import { Euler, type Group, type Object3D, Quaternion, Vector3 } from "three"

import { useMesh } from "@/hooks/use-mesh"
import { useFrameCallback } from "@/hooks/use-pausable-time"

import { useConnector } from "../../lib/connector"
import { useGame } from "../../lib/use-game"
import {
  type OnIntersectCallback,
  Sensor,
  type SensorInterface
} from "../../sensors"

export interface CarProps {
  onIntersectionEnter?: OnIntersectCallback
  position?: [number, number, number]
}

export const Car = forwardRef<Group, CarProps>(
  ({ onIntersectionEnter, ...props }, ref) => {
    const showHitBoxes = useGame((s) => s.showHitBoxes)
    const groupRef = useRef<Object3D | null>(null)

    const { cars } = useMesh()

    const randomCar = useMemo(() => {
      return cars[Math.floor(Math.random() * cars.length)]?.clone()
    }, [cars])

    const wheelRefs = useRef<Object3D[]>([])

    useEffect(() => {
      wheelRefs.current = []
      randomCar?.traverse((child) => {
        if (child.name.includes("WF") || child.name.includes("WB")) {
          wheelRefs.current.push(child)
        }
      })
    }, [randomCar])

    useFrameCallback((_, delta) => {
      for (const wheel of wheelRefs.current) {
        wheel.rotation.x += delta * 10
      }
    })

    const {
      position,
      direction,
      colliderPos,
      startedRef,
      quaterion,
      rotation
    } = useMemo(
      () => ({
        startedRef: { current: false },
        position: new Vector3(),
        direction: new Vector3(),
        quaterion: new Quaternion(),
        rotation: new Euler(),
        colliderPos: new Vector3()
      }),
      []
    )

    const sensorRef = useRef<SensorInterface | null>(null)
    const [startedSensor, setStartedSensor] = useState(false)

    // Cleanup sensor on unmount
    useEffect(() => {
      return () => {
        if (sensorRef.current) {
          // Reset sensor state
          sensorRef.current.active = false
          startedRef.current = false
          setStartedSensor(false)
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
      const handleRestart = () => {
        if (sensorRef.current) {
          sensorRef.current.active = true
          startedRef.current = true
          setStartedSensor(true)
        }
      }

      useConnector.getState().subscribable.restart.addCallback(handleRestart)
      return () => {
        useConnector
          .getState()
          .subscribable.restart.removeCallback(handleRestart)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useFrameCallback(() => {
      // calculate direction using vehicle position
      randomCar?.getWorldPosition(position)
      randomCar?.getWorldDirection(direction)
      //update rotation
      randomCar?.getWorldQuaternion(quaterion)
      rotation.setFromQuaternion(quaterion)

      colliderPos.copy(position)
      colliderPos.y += motoColliderScale[1]

      if (!startedRef.current) {
        setStartedSensor(true)
        startedRef.current = true
      }
    })

    return (
      <>
        <Sensor
          ref={sensorRef}
          position={colliderPos}
          halfSize={motoColliderScale}
          active={startedSensor}
          rotation={rotation}
          debug={showHitBoxes}
          onIntersect={onIntersectionEnter}
        />
        <group ref={mergeRefs([ref, groupRef])} {...props}>
          <group position={[0, 0, 0]} rotation={[0, Math.PI * -0.5, 0]}>
            {randomCar && <primitive object={randomCar} />}
          </group>
        </group>
      </>
    )
  }
)

const motoColliderScale = [1.5, 3.5, 9].map((s) => s / 2) as [
  number,
  number,
  number
]

Car.displayName = "Car"
